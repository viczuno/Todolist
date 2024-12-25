sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Client",
    "todoapp/util/graphql/Todos",
    "sap/ui/core/Core",
    "todoapp/formatter/Formatter",
    "sap/m/MessageBox",
    "sap/ui/core/mvc/XMLView",
    "todoapp/util/datetime/Datetime",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, JSONModel, Client,
             Todos, Core, Formatter, MessageBox, XMLView, DateTime, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("todoapp.controller.Todos", {

        formatter: Formatter,

        onInit: async function () {
            if (!Formatter.hasCookie()) {
                MessageToast.show("Please log in first.")
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRoutePatternMatched(this.onBeforeRouteMatched, this);
            this.oTodosModel = new JSONModel();
            this.getView().setModel(this.oTodosModel, "todos");

            await Core.getEventBus().subscribe("todoapp", "update", this.handleUpdate, this);
            await this.setUpTodos();
        },

        onBeforeRouteMatched: function() {
            this.oTodosModel.refresh();
            this.onClearFiltersPress();
        },

        handleUpdate: function(ns, ev, eventData) {
            this.setUpTodos();
        },

        setUpTodos: async function () {
            try {
                let todosQuery = Todos.getTodos();
                if (Formatter.isAdmin()) {
                    todosQuery = Todos.getTodosGlobal();
                }
                const result = await Client.fetch(todosQuery);

                const completedTasks = result.filter(todo => todo.completed).length;
                const totalTasks = result.length;

                this.oTodosModel.setData({
                    data: result,
                    completedTasks: completedTasks,
                    totalTasks: totalTasks
                });
            } catch (error) {
                console.error("Error fetching todos:", error);
                MessageToast.show("Failed to load todos.");
            }
        },

        isTodoCompleted: function(completed) {
            if (typeof completed !== "boolean") {
                console.error("Completed is not boolean");
            }
            const perm = this.formatter.hasWriterAdminPer();
            return !completed && perm;
        },

        isCompleted: function(completed) {
            return typeof completed === "boolean" ? (completed ? "Yes" : "No") : console.error("Completed is not boolean");
        },

        onDeleteTodo: function (oEvent) {
                let oButton = oEvent.getSource();
                let oContext = oButton.getParent().getBindingContext("todos");
                let todoId = oContext.getProperty("id");
            MessageBox.confirm("Are you sure you want to remove this todo?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: async function(sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        try {
                            const sQuery = Todos.deleteTodo(todoId);
                            const aResult = await Client.fetch(sQuery);
                        } catch (error) {
                            console.error("Error fetching todo:", error);
                            MessageToast.show("Failed to load todo.");
                        }

                        const aData = this.oTodosModel.getProperty("/data");
                        const updatedData = aData.filter(todo => todo.id !== todoId);
                        this.oTodosModel.setProperty("/data", updatedData);

                        MessageToast.show("Todo successfully removed");
                    }
                }.bind(this)
            });
        },

        onCompletePress: async function(oEvent) {
            let oButton = oEvent.getSource();
            let oContext = oButton.getParent().getBindingContext("todos");
            let todoId = oContext.getProperty("id");
            MessageBox.confirm("Complete this task?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: async function(sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        try {
                            const sQuery = Todos.completeTodo(todoId);
                            const aResult = await Client.fetch(sQuery);
                        } catch (error) {
                            console.error("Error completing todo:", error);
                            MessageToast.show("Failed to complete todo.");
                        }

                        await this.setUpTodos();

                        MessageToast.show("Todo completed successfully");
                    }
                }.bind(this)
            });
        },

        onEditPress: async function (oEvent) {
            if (!this.todoDialog) {
                this.todoDialog = await XMLView.create({
                    id: "todoDialogView",
                    viewName: "todoapp.view.CreateTodoDialog"
                });
                this.getView().addDependent(this.todoDialog);
            }

            const oTodoModel = this.todoDialog.getModel("todo");

            const oContext = oEvent.getSource().getBindingContext("todos");
            const oData = oContext.getObject();

            oTodoModel.setProperty("/listId", oData.list.id);

            if (oContext) {
                oTodoModel.setProperty("/id", oData.id);
                oTodoModel.setProperty("/isEditMode", true);
                oTodoModel.setProperty("/title", oData.title);
                oTodoModel.setProperty("/description", oData.description);
                oTodoModel.setProperty("/priority", oData.priority);
                oTodoModel.setProperty("/tags", oData.tags);
                oTodoModel.setProperty("/assignedTo", oData.assignedTo);
                oTodoModel.setProperty("/completed", oData.completed);
                oTodoModel.setProperty("/startDateTime", oData.startDate);
                oTodoModel.setProperty("/endDateTime", oData.dueDate);
                oTodoModel.setProperty("/rawStartDateTime", oData.startDate ? DateTime.readableFormatter().format(new Date(oData.startDate)) : null);
                oTodoModel.setProperty("/rawEndDateTime",  oData.dueDate ? DateTime.readableFormatter().format(new Date(oData.dueDate)): null);

                this.todoDialog.byId("createTodoDialog").open();
            } else {
                MessageToast.show("No todo item selected for editing.");
            }

        },

        onClearFiltersPress: function() {
            const oTitleSearch = this.getView().byId("titleSearch");
            const oListNameSearch = this.getView().byId("listNameSearch");
            const oPriorityFilter = this.getView().byId("priorityFilter");
            const oCompletedFilter = this.getView().byId("completedFilter");

            oTitleSearch.setValue("");
            oListNameSearch.setValue("");
            oPriorityFilter.setSelectedKey("None");
            oCompletedFilter.setSelectedKey("None");

            this._sTitleSearch = "";
            this._sListNameSearch = "";
            this._sSelectedPriority = "None";
            this._sSelectedCompleted = "None";

            this._applyCombinedFilters();
        },

        onPriorityChange: function(oEvent) {
            this._sSelectedPriority = oEvent.getParameter("selectedItem").getKey();
            this._applyCombinedFilters();
        },

        onCompletedChange: function(oEvent) {
            this._sSelectedCompleted = oEvent.getParameter("selectedItem").getKey();
            this._applyCombinedFilters();
        },

        onTitleSearchChange: function(oEvent) {
            this._sTitleSearch = oEvent.getParameter("value");
            this._applyCombinedFilters();
        },

        onListNameSearchChange: function(oEvent) {
            this._sListNameSearch = oEvent.getParameter("newValue");
            this._applyCombinedFilters();
        },

        _applyCombinedFilters: function() {
            let aFilters = [];

            if (this._sSelectedPriority && this._sSelectedPriority !== "None") {
                let oPriorityFilter = new Filter("priority", FilterOperator.EQ, this._sSelectedPriority);
                aFilters.push(oPriorityFilter);
            }

            if (this._sSelectedCompleted && this._sSelectedCompleted !== "None") {
                let bCompleted = (this._sSelectedCompleted === "Completed");
                let oCompletedFilter = new Filter("completed", FilterOperator.EQ, bCompleted);
                aFilters.push(oCompletedFilter);
            }

            if (this._sTitleSearch && this._sTitleSearch.trim() !== "") {
                let oTitleFilter = new Filter("title", FilterOperator.StartsWith, this._sTitleSearch);
                aFilters.push(oTitleFilter);
            }

            if (this._sListNameSearch && this._sListNameSearch.trim() !== "") {
                let oListNameFilter = new Filter("list/name", FilterOperator.StartsWith, this._sListNameSearch);
                aFilters.push(oListNameFilter);
            }

            let oTable = this.getView().byId("todosTable");
            let oBinding = oTable.getBinding("items");

            oBinding.filter(aFilters);
        }
    });
});
