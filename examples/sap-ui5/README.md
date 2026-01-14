# ChatKit sample-app

This is a sample application demonstrating the integration of [ChatKit](https://xpertai.cn/en/docs/ai/chatkit/) into an [OpenUI5](https://openui5.org/) application.

## Prerequisites

- [XpertAI Platform](https://xpertai.cn/en/docs/ai/)
- The [UI5 CLI](https://github.com/UI5/cli).
    - For installation instructions please see: [Installation](https://ui5.github.io/cli/stable/pages/CLI/#installation).

## Getting started
1. Clone this repository and navigate into it
    ```sh
    git clone https://github.com/xpert-ai/xpertai-chatkit-advanced-samples.git
    cd examples/sap-ui5
    ```
1. Install all dependencies
    ```sh
    npm install
    ```
1. Import the `xpert-demo-fiori.yaml` DSL file into the XpertAI platform, publish it, and obtain the corresponding Xpert ID.
1. Configure ChatKit
    - Open the `webapp/manifest.json` file and replace `your-xpert-id-here` with your actual Xpert ID (in the previous step) in the `chatkit` configuration section, ensure the `frameUrl` and `apiUrl` match your XpertAI platform settings if necessary.
    - Open the `webapp/controller/App.controller.js` file and change the `getClientSecret` function to retrieve the client secret (XpertAI key) from your backend (odata) service. For testing purposes, you can directly return your client secret string.
1. Start a local server and run the application (http://localhost:8080/index.html)
    ```sh
    ui5 serve -o index.html
    ```
