sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Todos",
    "todoapp/util/graphql/Client",
    "todoapp/util/graphql/Lists",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Core",
    "sap/ui/core/format/DateFormat",
    "todoapp/util/datetime/Datetime",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "todoapp/formatter/Formatter"
], function (Controller, XMLView, JSONModel,
             Todos, Client, Lists, MessageToast, MessageBox,
             Core, DateFormat, Datetime, Filter, FilterOperator, Formatter) {
    "use strict";

    return Controller.extend("todoapp.controller.List", {

        formatter: Formatter,

        onInit: async function () {
            if (!Formatter.hasCookie()) {
                this.getOwnerComponent().getRouter().navTo("login");
                MessageToast.show("Please log in first.")
                return;
            }

            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRoutePatternMatched(this.onBeforeRouteMatched, this);

            await Core.getEventBus().subscribe("todoapp", "todoAdded", this.handleTodoAdded, this);
            await Core.getEventBus().subscribe("todoapp", "todoUpdated", this.handleTodoUpdated, this);
            await Core.getEventBus().subscribe("todoapp", "updated", this.handleListUpdated, this);
        
            this.oTodoModel = new JSONModel();
            this.oSelectedList = new JSONModel({
                data: {
                    visibility: "PRIVATE"
                }
            });

            this.getView().setModel(this.oSelectedList, "selectedList");
            this.getView().setModel(this.oTodoModel, "todos");

            this.getOwnerComponent().getRouter().getRoute("list").attachPatternMatched(this.onRouteMatched, this);
        },

        handleListUpdated: async function(ns, ev, eventData) {
            this.oSelectedList.setData({data: eventData});
            this.oSelectedList.refresh();
        },

        handleTodoAdded: function(ns, ev, eventData) {
            const currentData = this.oTodoModel.getData().data || [];
            currentData.push(eventData);
            this.oTodoModel.setData({ data: currentData });
            this.updateCompletionPercentage();
            this.oTodoModel.refresh(true);
            sap.ui.core.UIComponent.getRouterFor(this).navTo(sap.ui.core.UIComponent.getRouterFor(this).getHashChanger().getHash(), {}, true);
        },

        handleTodoUpdated: function(ns, ev, eventData) {
            const currentData = this.oTodoModel.getData().data || [];
            const todoIndex = currentData.findIndex(todo => todo.id === eventData.id);

            if (todoIndex !== -1) {
                currentData[todoIndex] = { ...currentData[todoIndex], ...eventData };
                this.oTodoModel.setData({ data: currentData });
            } else {
                console.warn("Todo not found to update");
            }
            let oFlexibleColumnLayout = this.getView().byId("flexibleColumnLayout");
            oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
            let oSelectedItemModel = this.getView().byId("todosTable");
            oSelectedItemModel.removeSelections();
            this.updateCompletionPercentage();
            sap.ui.core.UIComponent.getRouterFor(this).navTo(sap.ui.core.UIComponent.getRouterFor(this).getHashChanger().getHash(), {}, true);
        },

        onRouteMatched: async function(oEvent) {
            const args = oEvent.getParameter("arguments");
            this.listId = args.listId;

            await this.setUpTodos();
            await this.setUpList();
        },

        onBeforeRouteMatched: function (oEvent) {
            this.onClearFiltersPress();
            let oFlexibleColumnLayout = this.getView().byId("flexibleColumnLayout");
            oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
            this.onCloseDetails();
        },

        setUpTodos: async function () {

            try {
                const sQuery = Todos.getTodosByList(this.listId);
                const aResult = await Client.fetch(sQuery);

                this.oTodoModel.setData({ data: aResult });
            } catch (error) {
                console.error("Error fetching todos:", error);
                MessageToast.show("Failed to load todos.");
            }

        },

        setUpList: async function () {
            try {
                const sQuery = Lists.getListByID(this.listId)
                const aResult = await Client.fetch(sQuery);

                this.oSelectedList.setData({ data: aResult});
            } catch (error) {
                console.error("Error fetching list: ", error);
                MessageToast.show("Failed to load list");
            }
        },

        onItemSelect: function (oEvent) {

            let oSelectedItem = oEvent.getParameter("listItem").getBindingContext("todos").getObject();

            let oSelectedItemModel = new sap.ui.model.json.JSONModel(oSelectedItem);
            this.getView().setModel(oSelectedItemModel, "selectedItem");

            let oFlexibleColumnLayout = this.getView().byId("flexibleColumnLayout");
            oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsBeginExpanded);
            this.getView().getModel("selectedItem").refresh(true);
        },

        onNavBack: function () {
            let oFlexibleColumnLayout = this.getView().byId("flexibleColumnLayout");
            oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
            this.onCloseDetails();
            this.getOwnerComponent().getRouter().navTo("lists");
        },

        onCloseDetails: function () {
            let oFlexibleColumnLayout = this.getView().byId("flexibleColumnLayout");
            oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
            let oTable = this.getView().byId("todosTable");

            if (oTable) {
                oTable.removeSelections(true);
            }

            let oObjectPageLayout = this.getView().byId("ObjectPageLayout");
            if (oObjectPageLayout) {
                oObjectPageLayout.setSelectedSection(this.createId("metadata"));
            }
        },

        onDeleteTodo: function (oEvent) {
            const oContext = this.getView().getModel("selectedItem");

            const oTodoData = oContext.getData();
            MessageBox.confirm("Are you sure you want to remove this todo?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: async function(sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        try {
                            const sQuery = Todos.deleteTodo(oTodoData.id);
                            const aResult = await Client.fetch(sQuery);
                        } catch (error) {
                            console.error("Error fetching todo:", error);
                            MessageToast.show("Failed to load todo.");
                        }

                        this.updateCompletionPercentage();

                        Core.getEventBus().publish("todoapp", "update", {id: this.listId});
                        this.onCloseDetails();

                        const aData = this.oTodoModel.getProperty("/data");
                        const updatedData = aData.filter(todo => todo.id !== oTodoData.id);
                        this.oTodoModel.setProperty("/data", updatedData);

                        MessageToast.show("Todo removed with name: " + oTodoData.title);
                    }
                }.bind(this)
            });
        },

        onDeletePress: function(oEvent) {
            const oListData = this.oTodoModel.getData();

            MessageBox.confirm("Are you sure you want to remove this list?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: async function(sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        try {
                            const sQuery = Lists.deleteList(this.listId);
                            const aResult = await Client.fetch(sQuery);
                        } catch (error) {
                            console.error("Error fetching lists:", error);
                            MessageToast.show("Failed to load lists.");
                        }

                        Core.getEventBus().publish("todoapp", "listDeleted", {id: this.listId});
                        this.getOwnerComponent().getRouter().navTo("lists");

                        MessageToast.show("List removed with name: " + oListData.name);
                    }
                }.bind(this)
            });
        },

        onAddOrEditTodo: async function (oEvent, isEditMode) {
            if (!this.todoDialog) {
                this.todoDialog = await XMLView.create({
                    id: "editTodoDialogView",
                    viewName: "todoapp.view.CreateTodoDialog"
                });
                this.getView().addDependent(this.todoDialog);
            }

            const oTodoModel = this.todoDialog.getModel("todo");

            oTodoModel.setProperty("/listId", this.listId);

            if (isEditMode) {
                const oContext = this.getView().getModel("selectedItem");
                const oTodoData = oContext.getData();

                oTodoModel.setProperty("/id", oTodoData.id);
                oTodoModel.setProperty("/isEditMode", true);
                oTodoModel.setProperty("/title", oTodoData.title);
                oTodoModel.setProperty("/description", oTodoData.description);
                oTodoModel.setProperty("/priority", oTodoData.priority);
                oTodoModel.setProperty("/tags", oTodoData.tags);
                oTodoModel.setProperty("/assignedTo", oTodoData.assignedTo);
                oTodoModel.setProperty("/completed", oTodoData.completed);
                oTodoModel.setProperty("/startDateTime", oTodoData.startDate);
                oTodoModel.setProperty("/endDateTime", oTodoData.dueDate);
                oTodoModel.setProperty("/rawStartDateTime", oTodoData.startDate ? Datetime.readableFormatter().format(new Date(oTodoData.startDate)) : null);
                oTodoModel.setProperty("/rawEndDateTime",  oTodoData.dueDate ? Datetime.readableFormatter().format(new Date(oTodoData.dueDate)) : null);

                this.todoDialog.byId("createTodoDialog").open();
            } else {
                oTodoModel.setProperty("/isEditMode", false);
                this.todoDialog.byId("createTodoDialog").open();
            }
        },

        onAddTodo: function (oEvent) {
            this.onAddOrEditTodo(oEvent, false);
        },

        onAddUser: async function (oEvent) {
            if (!this.addUserDialog) {
                this.addUserDialog = await XMLView.create({
                    id: "userDialog",
                    viewName: "todoapp.view.AddUserDialog"
                });
                this.getView().addDependent(this.addUserDialog);
            }
            const oAccessModel = this.addUserDialog.getModel("access");

            const listData = this.oSelectedList.getData();
            oAccessModel.setProperty("/owner", listData.data.owner.id)
            oAccessModel.setProperty("/listId", this.listId);
            this.addUserDialog.byId("addUserDialog").open();
        },

        onEditPress: function (oEvent) {
            this.onAddOrEditTodo(oEvent, true);
        },

        onEditListPress: async function (oEvent) {
            if (!this.editListDialog) {
                this.editListDialog = await XMLView.create({
                    id: "editListDialog",
                    viewName: "todoapp.view.CreateListDialog"
                });
                this.getView().addDependent(this.editListDialog);
            }

            const oListModel = this.editListDialog.getModel("listModel");
            await this.setUpList();
            const oSelectedListData = this.oSelectedList.getData();

            oListModel.setProperty("/isEditMode", true);
            oListModel.setProperty("/id", this.listId);
            oListModel.setProperty("/name", oSelectedListData.data.name);
            oListModel.setProperty("/description", oSelectedListData.data.description);
            oListModel.setProperty("/visibility", oSelectedListData.data.visibility);
            oListModel.setProperty("/tags", oSelectedListData.data.tags);

            this.editListDialog.byId("createListDialog").open();
        },

        onCompletePress: async function(oEvent) {
            const oContext = this.getView().getModel("selectedItem");

            const oTodoData = oContext.getData();
            MessageBox.confirm("Complete this task?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: async function(sAction) {
                    if (sAction === MessageBox.Action.YES) {
                        try {
                            const sQuery = Todos.completeTodo(oTodoData.id);
                            const aResult = await Client.fetch(sQuery);
                        } catch (error) {
                            console.error("Error completing todo:", error);
                            MessageToast.show("Failed to complete todo.");
                        }

                        this.onCloseDetails();
                        await this.setUpTodos();

                        MessageToast.show("Todo completed with name: " + oTodoData.title);
                    }
                }.bind(this)
            });
        },

        onClearFiltersPress: function() {
            const oPriorityFilter = this.getView().byId("priorityFilter");
            const oCompletedFilter = this.getView().byId("completedFilter");

            oPriorityFilter.setSelectedKey("None");
            oCompletedFilter.setSelectedKey("None");

            this._sSelectedPriority = "None";
            this._sSelectedCompleted = "None";

            this._applyCombinedFilters();
        },

        isTodoCompleted: function(completed) {
            if (typeof completed !== "boolean") {
                console.error("Completed is not boolean");
            }
            const perm = this.formatter.hasWriterAdminPer();
            return !completed && perm;
        },

        isListShared: function(visibility) {
            if (typeof visibility !== "string" || visibility === "") {
                console.error("Visibility is not boolean or it is an empty string");
            }
            const perm = this.formatter.hasWriterAdminPer();
            return perm && visibility !== "PRIVATE";
        },

        isListPrivate: function(visibility) {
            return !this.isListShared(visibility) && visibility === "PRIVATE";
        },

        formatTags: function (aTags) {
            return aTags && aTags.length > 0 ? aTags.join(", ") : "N/A";
        },

        isCompleted: function(completed) {
            return typeof completed === "boolean" ? (completed ? "Yes" : "No") : console.error("Completed is not boolean");
        },

        onPriorityChange: function(oEvent) {
            this._sSelectedPriority = oEvent.getParameter("selectedItem").getKey();
            this._applyCombinedFilters();
        },

        onCompletedChange: function(oEvent) {
            this._sSelectedCompleted = oEvent.getParameter("selectedItem").getKey();
            this._applyCombinedFilters();
        },

        _applyCombinedFilters: function() {
            let aFilters = [];
            if (this._sSelectedPriority && this._sSelectedPriority !== "None") {
                let oPriorityFilter = new Filter("priority", FilterOperator.EQ, this._sSelectedPriority);
                aFilters.push(oPriorityFilter);
            }

            if (this._sSelectedCompleted && this._sSelectedCompleted !== "None") {
                let bCompleted = this._sSelectedCompleted === "Completed";
                let oCompletedFilter = new Filter("completed", FilterOperator.EQ, bCompleted);
                aFilters.push(oCompletedFilter);
            }

            let oTable = this.getView().byId("todosTable");
            let oBinding = oTable.getBinding("items");

            oBinding.filter(aFilters);
        },

        updateCompletionPercentage: function () {
            const aTodos = this.oTodoModel.getProperty("/data");
            const completedTodos = aTodos.filter(todo => todo.completed).length;
            const totalTodos = aTodos.length;
            const percentage = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
            this.oTodoModel.refresh(true);
        },

        formatDate: function (dateString) {
            const defaultValue = "0001-01-01";

            if (!dateString || dateString.startsWith(defaultValue)) {
                return "N/A";
            }

            let oDate = new Date(dateString);
            return Datetime.readableFormatter().format(oDate);
        }
    });
});
