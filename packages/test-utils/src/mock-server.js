import fetchMock from "fetch-mock";
import { executeQuery } from "./execute-query";

export function makeMockRequest(request) {
  fetchMock.reset();
  fetchMock.restore();

  return executeQuery(request).then(response => {
    fetchMock.post("*", response);

    return response;
  });
}
