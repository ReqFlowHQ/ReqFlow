const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeNetworkError,
  normalizeUpstreamHttpError,
  executeRequest,
} = require('../dist/utils/executeRequest');

const NETWORK_ERROR_SCHEMA = {
  type: 'object',
  required: ['error', 'code', 'message'],
  properties: {
    error: { type: 'string', const: 'Upstream network error' },
    code: {
      type: 'string',
      enum: [
        'DNS_RESOLUTION_FAILED',
        'CONNECTION_REFUSED',
        'UPSTREAM_TIMEOUT',
        'NETWORK_UNREACHABLE',
        'INVALID_PROTOCOL',
        'NETWORK_ERROR',
      ],
    },
    message: { type: 'string', minLength: 1 },
  },
};

const UPSTREAM_HTTP_ERROR_SCHEMA = {
  type: 'object',
  required: ['error', 'status', 'statusText', 'data'],
  properties: {
    error: { type: 'string', const: 'Upstream responded with error' },
    status: { type: 'number' },
    statusText: { type: 'string', minLength: 1 },
    data: {},
  },
};

const SSRF_ERROR_SCHEMA = {
  type: 'object',
  required: ['error', 'code', 'message'],
  properties: {
    error: { type: 'string', const: 'SSRF blocked error' },
    code: { type: 'string', const: 'SSRF_BLOCKED' },
    message: { type: 'string', minLength: 1 },
  },
};

function validateSchema(value, schema, path = '$') {
  if (schema.type === 'object') {
    assert.equal(typeof value, 'object', `${path} must be object`);
    assert.notEqual(value, null, `${path} must not be null`);

    for (const key of schema.required || []) {
      assert.ok(key in value, `${path}.${key} is required`);
    }

    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      if (!(key in value)) continue;
      if (Object.keys(propSchema).length === 0) continue;
      validateSchema(value[key], propSchema, `${path}.${key}`);
    }
    return;
  }

  if (schema.type === 'string') {
    assert.equal(typeof value, 'string', `${path} must be string`);
    if (typeof schema.minLength === 'number') {
      assert.ok(value.length >= schema.minLength, `${path} must have min length ${schema.minLength}`);
    }
    if (schema.const !== undefined) {
      assert.equal(value, schema.const, `${path} must equal ${schema.const}`);
    }
    if (Array.isArray(schema.enum)) {
      assert.ok(schema.enum.includes(value), `${path} must be one of ${schema.enum.join(', ')}`);
    }
    return;
  }

  if (schema.type === 'number') {
    assert.equal(typeof value, 'number', `${path} must be number`);
    return;
  }

  if (schema.const !== undefined) {
    assert.equal(value, schema.const, `${path} must equal ${schema.const}`);
  }
}

test('network error payload contract', () => {
  const cases = [
    { code: 'ENOTFOUND', message: 'dns failed' },
    { code: 'ECONNREFUSED', message: 'refused' },
    { code: 'ECONNABORTED', message: 'timed out' },
    { code: 'ENETUNREACH', message: 'unreachable' },
    { code: 'ERR_INVALID_URL', message: 'unsupported protocol' },
    { code: 'UNKNOWN_ERR', message: 'fallback case' },
  ];

  for (const sample of cases) {
    const normalized = normalizeNetworkError(sample);
    assert.ok(normalized.status >= 400);
    validateSchema(normalized.data, NETWORK_ERROR_SCHEMA);
  }
});

test('upstream http error payload contract', () => {
  const normalized404 = normalizeUpstreamHttpError({
    status: 404,
    statusText: 'Not Found',
    data: { message: 'missing' },
    headers: { 'content-type': 'application/json' },
  });

  const normalized500 = normalizeUpstreamHttpError({
    status: 500,
    statusText: 'Internal Server Error',
    data: { message: 'boom' },
    headers: { 'content-type': 'application/json' },
  });

  validateSchema(normalized404.data, UPSTREAM_HTTP_ERROR_SCHEMA);
  validateSchema(normalized500.data, UPSTREAM_HTTP_ERROR_SCHEMA);
  assert.equal(normalized404.data.status, 404);
  assert.equal(normalized500.data.status, 500);
});

test('ssrf blocked payload contract', async () => {
  const blocked = await executeRequest('GET', 'http://localhost:8080/internal', {}, undefined);
  assert.equal(blocked.status, 400);
  validateSchema(blocked.data, SSRF_ERROR_SCHEMA);
});
