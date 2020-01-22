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
    <meta charset="UTF-8">
    <title>My awesome new web app!</title>
    <link rel="stylesheet" href="style.css"><link>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>
`

export default {
  helloWorld,
  indexHtml
}