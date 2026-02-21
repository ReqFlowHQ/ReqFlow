const test = require("node:test");
const assert = require("node:assert/strict");

const { deleteCollection } = require("../dist/controllers/collectionController");
const Collection = require("../dist/models/Collection").default;
const RequestModel = require("../dist/models/Request").default;

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

test("deleteCollection cascades request deletion for the same user + collection", async () => {
  const originalDeleteOne = Collection.deleteOne;
  const originalDeleteMany = RequestModel.deleteMany;

  let collectionQuery = null;
  let requestQuery = null;

  Collection.deleteOne = async (query) => {
    collectionQuery = query;
    return { deletedCount: 1 };
  };
  RequestModel.deleteMany = async (query) => {
    requestQuery = query;
    return { deletedCount: 3 };
  };

  try {
    const req = {
      userId: "user-1",
      params: { id: "collection-1" },
    };
    const res = createMockRes();

    await deleteCollection(req, res);

    assert.deepEqual(collectionQuery, {
      _id: "collection-1",
      user: "user-1",
    });
    assert.deepEqual(requestQuery, {
      user: "user-1",
      collection: "collection-1",
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.message, "Collection deleted");
    assert.equal(res.payload.deletedRequests, 3);
  } finally {
    Collection.deleteOne = originalDeleteOne;
    RequestModel.deleteMany = originalDeleteMany;
  }
});

test("deleteCollection returns 404 when collection does not exist", async () => {
  const originalDeleteOne = Collection.deleteOne;
  const originalDeleteMany = RequestModel.deleteMany;

  let deleteManyCalled = false;

  Collection.deleteOne = async () => ({ deletedCount: 0 });
  RequestModel.deleteMany = async () => {
    deleteManyCalled = true;
    return { deletedCount: 0 };
  };

  try {
    const req = {
      userId: "user-1",
      params: { id: "missing-collection" },
    };
    const res = createMockRes();

    await deleteCollection(req, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.payload.error, "Collection not found");
    assert.equal(deleteManyCalled, false);
  } finally {
    Collection.deleteOne = originalDeleteOne;
    RequestModel.deleteMany = originalDeleteMany;
  }
});
