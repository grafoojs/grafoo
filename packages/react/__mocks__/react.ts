import * as React from "react";

module.exports = {
  ...React,
  useState: initialState => {
    let [state, setState] = React.useState(initialState);
    return [
      state,
      update => {
        require("react-test-renderer").act(() => {
          setState(update);
        });
      }
    ];
  }
};
