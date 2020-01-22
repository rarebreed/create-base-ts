const helloWorld = `
import * as React from "react";
import * as ReactDom from "react-dom";

class App extends React.Component {
    render() {
        return (
            <div>Hello World!</div>
        )
    }
}

ReactDom.render(<App />, document.querySelector("#app"));
`

const indexHtml = `
<!DOCTYPE html>
<html lang="en-us">
  <head>
    <meta charset="UTF-8" name="viewport" content="width=device-width, initial-scale=1">
    <title>My awesome new web app!</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.8.0/css/bulma.min.css">
    <script defer src="https://use.fontawesome.com/releases/v5.3.1/js/all.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="./index.js"></script>
  </body>
</html>
`

export default {
  helloWorld,
  indexHtml
}