sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "todoapp/formatter/Formatter"
], function (Controller, UIComponent, JSONModel, MessageToast, Formatter) {
    "use strict";

    return Controller.extend("todoapp.controller.Login", {
        formatter: Formatter,

        onInit: function () {
            this.oUserModel = new JSONModel();
            this.getView().setModel(this.oUserModel, "user")
        },

        onLoginPress: async function () {

            try {
                window.location.href = "http://localhost:8000/login/github";
                MessageToast.show("Successfully logged in!");
            } catch (e) {
                MessageToast.show("An error occurred while trying to log in.");
                console.error(e);
            }
        },

        onSupportPress: function() {
            let supportUrl = "https://github.tools.sap/I750921/Intern-Project/blob/main/README.md";
            window.open(supportUrl, "_blank");
        }
    });
});
