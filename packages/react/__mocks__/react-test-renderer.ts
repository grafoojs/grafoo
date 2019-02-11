import * as TestRenderer from "react-test-renderer";

module.exports = {
  ...TestRenderer,
  create: next => {
    let ctx;

    TestRenderer.act(() => {
      ctx = TestRenderer.create(next);
    });

    return ctx;
  }
};
