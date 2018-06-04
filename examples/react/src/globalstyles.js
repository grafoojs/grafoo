import { injectGlobal } from "emotion";

injectGlobal`
  * {
    box-sizing: border-box;
  }

  body, html {
    margin: 0;
    padding: 0;
    font: 14px/1.21 helvetica, 'Noto Color Emoji', helvetica, arial, sans-serif;
  }
`;
