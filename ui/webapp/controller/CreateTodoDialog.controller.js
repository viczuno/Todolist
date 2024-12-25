sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/date/UI5Date',
    "sap/ui/core/ValueState",
    "sap/ui/model/json/JSONModel",
    "todoapp/util/graphql/Todos",
    "todoapp/util/graphql/Users",
    "todoapp/util/graphql/Lists",
    "sap/m/MessageToast",
    "todoapp/util/graphql/Client",
    "todoapp/util/datetime/Datetime",
    "sap/ui/core/Core"
], function (Controller, UI5Date, ValueState,  JSONModel, Todos, Users, Lists, MessageToast, Client, Datetime, Core) {
    "use strict";

    return Controller.extend("todoapp.controller.CreateTodoDialog", {
        MAX_NAME_LENGTH: 256,

        onInit: function () {
            this.oTodoModel = new JSONModel(this._initialModel());
            this.getView().setModel(this.oTodoModel, "todo");
        },

        onAfterClose: function () {
            this.resetModels();
        },

        onOpenDialog: async function (oEvent) {
            const oModel = this.oTodoModel.getData();
            await this.fetchUsers(oModel.listId);
        },

        onSubmitPress: async function () {
            const oModel = this.oTodoModel.getData();

            this._validateTitle(oModel.title);
            this._validatePriority(oModel.priority);
            this._validateAssignTo(oModel.assignedTo);
            this._validateDateTime(this.byId("startDateTime"), "startDateTime");
            this._validateDateTime(this.byId("endDateTime"), "endDateTime");

            const isInvalid = this.isModelInvalid(oModel);
            if (isInvalid) {
                return;
            }

            let result;
            const isEditMode = !!oModel.id;

            try {
                let query;
                if (isEditMode) {
                    query = Todos.updateTodo(oModel.id, {
                        title: oModel.title,
                        description: oModel.description,
                        priority: oModel.priority,
                        tags: oModel.tags,
                        completed: oModel.completed,
                        listID: oModel.listId,
                        assignedTo: oModel?.userId,
                        startDateTime: oModel.startDateTime,
                        endDateTime: oModel.endDateTime
                    });
                } else {
                    query = Todos.createTodo({
                        title: oModel.title,
                        description: oModel.description,
                        priority: oModel.priority,
                        tags: oModel.tags,
                        completed: false,
                        listID: oModel.listId,
                        assignedTo: oModel.userId,
                        startDateTime: oModel.startDateTime,
                        endDateTime: oModel.endDateTime
                    });
                }

                result = await Client.fetch(query);
                if (isEditMode) {
                    Core.getEventBus().publish("todoapp", "todoUpdated", result);
                } else {
                    Core.getEventBus().publish("todoapp", "todoAdded", result);
                }
                Core.getEventBus().publish("todoapp", "update", result);

                this.byId("createTodoDialog").close();
                MessageToast.show(`Todo ${isEditMode ? "updated" : "created"} with title: ${oModel.title}`);
            } catch (error) {
                console.error(`Error ${isEditMode ? "updating" : "creating"} todo:`, error);
                MessageToast.show(`Failed to ${isEditMode ? "update" : "create"} todo.`);
            }
        },

        formatTitle: function(bIsEditMode) {
            return bIsEditMode ? "Edit todo" : "Create todo";
        },

        onCancelPress: function () {
            this.resetModels();
            this.byId("createTodoDialog").close();
        },

        onSelectionChange: function(oEvent) {
            let oMultiComboBox = this.byId("createTodoTagsMultiComboBox");
            let aSelectedKeys = oMultiComboBox.getSelectedKeys();

            if (aSelectedKeys.length > 6) {
                let sKeyToRemove = oEvent.getParameter("changedItem").getKey();
                let iKeyIndex = aSelectedKeys.indexOf(sKeyToRemove);

                if (iKeyIndex > -1) {
                    aSelectedKeys.splice(iKeyIndex, 1);
                }

                oMultiComboBox.setSelectedKeys(aSelectedKeys);

                MessageToast.show("You can select a maximum of 6 tags.");
            }
        },

        onStartDateTimeChange: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const bValid = oEvent.getParameter("valid");
            if (!bValid) {
                return
            }

            if (sValue === "") {
                this.oTodoModel.setProperty("/startDateTime", null);
                this.oTodoModel.setProperty("/endDateTimeMinDate", null)

                return;
            }
            this.oTodoModel.setProperty(`/validation/startDateTime/text`, "");
            this.oTodoModel.setProperty(`/validation/startDateTime/type`, ValueState.None);

            const iUnixTimestamp = Datetime.formatDateToRFC3339(new Date(sValue))
            this.oTodoModel.setProperty("/startDateTime", iUnixTimestamp);
            this.oTodoModel.setProperty("/endDateTimeMinDate", new Date(sValue))
        },

        onEndDateTimeChange: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const bValid = oEvent.getParameter("valid");
            if (!bValid) {
                return
            }

            if (sValue === "") {
                this.oTodoModel.setProperty("/endDateTime", null);
                this.oTodoModel.setProperty("/startDateTimeMaxDate", null)

                return;
            }
            this.oTodoModel.setProperty(`/validation/endDateTime/text`, "");
            this.oTodoModel.setProperty(`/validation/endDateTime/type`, ValueState.None);

            const iUnixTimestamp = Datetime.formatDateToRFC3339(new Date(sValue))
            this.oTodoModel.setProperty("/endDateTime", iUnixTimestamp)
            this.oTodoModel.setProperty("/startDateTimeMaxDate", new Date(sValue))

        },

        validateTodoTitle: function (oEvent) {
            const sName = oEvent.getParameter("value");
            const sSanitizedName = (sName || "").trim().toLowerCase();
            this._validateTitle(sSanitizedName);
        },

        resetModels: function() {
            this.oTodoModel.setData(this._initialModel());
            this.byId("startDateTime").setDateValue(null);
            this.byId("endDateTime").setDateValue(null);
            this.byId("emailInput").setSelectedKey(null);
            this.byId("prioritySelect").setSelectedKey("")
        },

        isModelInvalid: function (oModel) {
            return Object.values(oModel.validation).some((oValidation) => {
                return oValidation.type === ValueState.Error
            })
        },

        onEmailChange: function (oEvent) {
            const selectedItem = oEvent.getParameter("selectedItem");
            if (selectedItem) {
                const selectedKey = selectedItem.getKey();

                this.oTodoModel.setProperty("/userId", selectedKey);
                this.oTodoModel.setProperty("/assignedTo/id", selectedKey);

                const selectedEmail = selectedItem.getText();
                this.oTodoModel.setProperty("/assignedTo/email", selectedEmail);

                this.byId("emailInput").setValue(selectedEmail);

                this.oTodoModel.setProperty("/validation/assignedTo/type", "None");
                this.oTodoModel.setProperty("/validation/assignedTo/text", "");
                this.byId("emailInput").blur();
            }
        },

        onTitleChange: function (oEvent) {
            const newValue = oEvent.getParameter("value");

            if (newValue.trim().length > 0) {
                this.oTodoModel.setProperty("/validation/title/type", "None");
                this.oTodoModel.setProperty("/validation/title/text", "");
            }
        },

        onPriorityChange: function (oEvent) {
            const selectedItem = oEvent.getParameter("selectedItem");
            if (selectedItem) {
                const selectedKey = selectedItem.getKey();
                this.oTodoModel.setProperty("/priority", selectedKey);
                this.oTodoModel.setProperty("/validation/priority", this._emptyValidation())
            }
        },

        fetchUsers: async function (id) {
            try {
                const query = Lists.getAccessesByListID(id);
                let accesses = await Client.fetch(query);

                const filteredUsers = accesses
                    .filter(item => item.status !== "pending")
                    .map(item => ({
                        id: item.user.id,
                        email: item.user.email,
                        role: item.user.role
                    }));

                this.oTodoModel.setProperty("/existingUsers", filteredUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
                MessageToast.show("Failed to fetch users.");
            }
        },

        _validateTitle: function (sTitle) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            }
            if (sTitle.length === 0) {
                oValidated.text = "Todo title should not be empty";
                oValidated.type = ValueState.Error
            } else if (sTitle.length > this.MAX_NAME_LENGTH) {
                oValidated.text = `Todo title should not exceed ${this.MAX_NAME_LENGTH} symbols`;
                oValidated.type = ValueState.Error
            }

            this.oTodoModel.setProperty("/validation/title/text", oValidated.text);
            this.oTodoModel.setProperty("/validation/title/type", oValidated.type);
        },

        _validatePriority: function (sPriority) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            }
            if (sPriority.length === 0) {
                oValidated.text = "Todo priority should not be empty";
                oValidated.type = ValueState.Error
            }

            this.oTodoModel.setProperty("/validation/priority/text", oValidated.text);
            this.oTodoModel.setProperty("/validation/priority/type", oValidated.type);
        },

        _validateAssignTo: function (sAssignTo) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            }
            if (!sAssignTo || !sAssignTo.email) {
                this.oTodoModel.setProperty("/validation/assignedTo/text", oValidated.text);
                this.oTodoModel.setProperty("/validation/assignedTo/type", oValidated.type);
                return;
            }

            const aExistingUsers = this.oTodoModel.getProperty("/existingUsers") || [];

            const isIdValid = aExistingUsers.some(function (user) {
                return user.email === sAssignTo.email;
            });

            if (!isIdValid && sAssignTo.email !== "") {
                oValidated.text = "This user is not part of the list";
                oValidated.type = ValueState.Error;
            }

            this.oTodoModel.setProperty("/validation/assignedTo/text", oValidated.text);
            this.oTodoModel.setProperty("/validation/assignedTo/type", oValidated.type);
        },

        _validateDateTime: function (oDateTimePicker, sModelName) {
            const oValidated = {
                text: "",
                type: ValueState.None,
            };

            const sValue = oDateTimePicker.getValue();

            if (sValue) {
                const dateObj = new Date(sValue);

                if (isNaN(dateObj.getTime())) {
                    oValidated.text = "Date time is not valid";
                    oValidated.type = ValueState.Error;
                }
            }

            this.oTodoModel.setProperty(`/validation/${sModelName}/text`, oValidated.text);
            this.oTodoModel.setProperty(`/validation/${sModelName}/type`, oValidated.type);
        },

        _loadTodoData: function (todoData) {
            this.oTodoModel.setData({
                id: todoData.id,
                title: todoData.title,
                description: todoData.description,
                priority: todoData.priority,
                tags: todoData.tags,
                assignedTo: todoData.assignedTo,
                startDateTime: todoData.startDateTime,
                endDateTime: todoData.endDateTime,
                listId: todoData.listId,
                validation: {
                    title:  this._emptyValidation(),
                    priority:  this._emptyValidation(),
                    startDateTime:  this._emptyValidation(),
                    endDateTime:  this._emptyValidation(),
                },
                existingUsers: []
            });
        },

        _initialModel: function () {
            return {
                isEditMode: false,
                title: "",
                description: "",
                tags: [],
                priority: "",
                listId: "",
                userId: "",
                startDateTime: null,
                endDateTime: null,
                rawStartDateTime: null,
                rawEndDateTime: null,
                assignedTo: {
                    id: "",
                    email: ""
                },
                validation: {
                    title: this._emptyValidation(),
                    assignedTo: this._emptyValidation(),
                    priority:  this._emptyValidation(),
                    startDateTime:  this._emptyValidation(),
                    endDateTime:  this._emptyValidation(),
                },
                existingUsers: [],
                endDateTimeMinDate: null,
                startDateTimeMaxDate: null,
            }
        },

        _emptyValidation: function () {
            return {
                text: "",
                type: ValueState.None
            }
        },
    });
});
