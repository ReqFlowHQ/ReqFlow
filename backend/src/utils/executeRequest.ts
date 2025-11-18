// FILE: backend/src/utils/executeRequest.ts
import axios, { Method } from "axios";

export const executeRequest = async (
  method: Method,
  url: string,
  headers: Record<string, string | number | boolean | null | undefined>,
  body?: any
) => {
  try {
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      validateStatus: () => true,
    });
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    };
  } catch (err: any) {
    return {
      status: 0,
      statusText: "Request Error",
      data: err.message || "Network error",
      headers: {},
    };
  }
};
