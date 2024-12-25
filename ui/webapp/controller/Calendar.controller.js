sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/date/UI5Date',
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Todos",
    "todoapp/util/graphql/Client",
    "sap/m/Popover",
    "sap/m/MessageToast",
    "todoapp/util/datetime/Datetime",
    "todoapp/formatter/Formatter"
], function (Controller, UI5Date, JSONModel, Todos, Client, Popover, MessageToast, Datetime, Formatter) {
    "use strict";

    return Controller.extend("todoapp.controller.Calendar", {
        formatter: Formatter,

        onInit: async function () {
            if (!Formatter.hasCookie()) {
                MessageToast.show("Please log in first.")
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            this.oTodoModel = new JSONModel();
            this.getView().setModel(this.oTodoModel, "todos");

            this.getOwnerComponent().getRouter().getRoute("calendar").attachPatternMatched(this.onRouteMatched, this);
        },

        onRouteMatched: async function () {
            await this.fetchData()
        },

        fetchData: async function () {
            try {
                let sQuery = Todos.getTodos();
                if (this.formatter.isAdmin()) {
                    sQuery = Todos.getTodosGlobal();
                }
                const aResult = await Client.fetch(sQuery);
                const aIncompleteTodos = aResult.filter(todo => !todo.completed);

                const oSanitizedDate = {
                    startDate: new Date(),
                    data: [{
                        items: aIncompleteTodos.map((r) => ({
                            ...r,
                            startDate: r.startDate ? UI5Date.getInstance(new Date(r.startDate)) : (r.dueDate ? UI5Date.getInstance(new Date(r.dueDate)) : null),
                            dueDate: UI5Date.getInstance(new Date(r.dueDate)),
                        })),
                    }]
                }
                this.oTodoModel.setData(oSanitizedDate);
            } catch (error) {
                console.error("Error fetching todos:", error);
                MessageToast.show("Failed to load todos.");
            }
        },

        onAppointmentSelect: function (oEvent) {
            const oAppointment = oEvent.getParameter("appointment");
            const sBindingPath = oAppointment.getBindingContext("todos").getPath();

            const oTodoData = this.getView().getModel("todos").getProperty(sBindingPath);

            const oSelectedItemModel = new sap.ui.model.json.JSONModel(oTodoData);
            this.getView().byId("todoDetailsPopover").setModel(oSelectedItemModel, "selectedItem");

            this.getView().byId("todoDetailsPopover").openBy(oAppointment);
        },

        onPopoverClose: function () {
            const oPopover = this.getView().byId("todoDetailsPopover");
            if (oPopover) {
                oPopover.close();
            }
        },

        formatDate: function (date) {
            const defaultValue = "Jan 01 0001";
            const dateString = date.toString();
            if (!dateString || dateString.includes(defaultValue)) {
                return "N/A";
            }

            let oDate = new Date(dateString);

            return Datetime.readableFormatter().format(oDate);
        }
    });
});
