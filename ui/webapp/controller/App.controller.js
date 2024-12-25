sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/mvc/Controller",
	"todoapp/util/rest/ClientRest",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"todoapp/util/graphql/Client",
	"todoapp/util/graphql/Users",
	"todoapp/util/graphql/Lists",
	"todoapp/formatter/Formatter"
  ], function (Core, Controller, ClientRest, MessageToast, JSONModel, Client, Users, Lists, Formatter) {
	"use strict";
  
	return Controller.extend("todoapp.controller.App", {
		formatter: Formatter,

		onInit: async function () {
			this.oUserModel = new JSONModel();
			this.getView().setModel(this.oUserModel, "user")
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.attachRouteMatched(this.restoreSelectedNavTab, this);

			this.oNotificationsModel = new JSONModel({ pendingLists: []});
			this.getView().setModel(this.oNotificationsModel, "notifications")

			const sQuery = Lists.getListsPending();
			const aResult = await Client.fetch(sQuery);
			this.oNotificationsModel.setData({ pendingLists: aResult })

			Core.getEventBus().subscribe("todoapp", "pendingListChange", this.handlePendingListChanged, this);
		},

		setUpUser: async function () {

			try {
				const sQuery = Users.getUser();
				const aResult = await Client.fetch(sQuery);

				this.oUserModel.setData({data: aResult})
			} catch (error) {
				console.error("Error fetching user:", error);
				MessageToast.show("Failed to load user.");
			}
		},

		onNavToLists: function () {
			this.getOwnerComponent().getRouter().navTo("lists");
			localStorage.setItem("selectedNavItem", "listsNav");
	  	},
		onNavToTodos: function () {
			this.getOwnerComponent().getRouter().navTo("todos");
			localStorage.setItem("selectedNavItem", "todosNav");
		},
		onNavToCalendar: function () {
			this.getOwnerComponent().getRouter().navTo("calendar");
			localStorage.setItem("selectedNavItem", "calendarNav");
		},
		onNavToInvites: function() {
			this.getOwnerComponent().getRouter().navTo("invites");
			localStorage.setItem("selectedNavItem", "invitesNav");
		},
		restoreSelectedNavTab: function(oEvent) {
			const sRouteName = oEvent.getParameter("name");
			const sideNavigation = this.getView().byId("sideNavigation");

			if (!sideNavigation) {
				return;
			}

			switch (sRouteName) {
				case "login":
					this.getOwnerComponent().getRouter().navTo("login");
					break;
				case "list":
				case "lists":
					sideNavigation.setSelectedItem(this.getView().byId("listsNav"));
					localStorage.setItem("selectedNavItem", "listsNav");
					break;
				case "todos":
					sideNavigation.setSelectedItem(this.getView().byId("todosNav"));
					localStorage.setItem("selectedNavItem", "todosNav");
					break;
				case "invites":
					sideNavigation.setSelectedItem(this.getView().byId("invitesNav"));
					localStorage.setItem("selectedNavItem", "invitesNav");
					break;
				case "calendar":
					sideNavigation.setSelectedItem(this.getView().byId("calendarNav"));
					localStorage.setItem("selectedNavItem", "calendarNav");
					break;
				default:
					console.warn("Unknown route:", sRouteName);
					break;
			}
		},

		onLogout: async function () {
			await this.setUpUser();
			const userEmail = this.oUserModel.getProperty("/data/email");

			if (!userEmail) {
				MessageToast.show("No user email found");
				return;
			}

			try {
				const requestBody = {
					email: userEmail
				};
				const result = await ClientRest.fetch('login/logout', 'POST', requestBody);
				this.getOwnerComponent().getRouter().navTo("login");
				window.location.reload();
			} catch (e) {
				console.error("Error during logout:", e);
				MessageToast.show("An error occurred during logout");
			}
		},

		getEmail: async function () {
			if (this.formatter.hasCookie()) {
				await this.setUpUser();
				return this.oUserModel.getProperty("/data/email");
			}
			return "no email found";
		},

		handleNotificationPress: function (oEvent) {
			const oButton = oEvent.getSource();

			const oPendingLists = this.oNotificationsModel.getProperty("/pendingLists");
			const oPopover = new sap.m.Popover({
				placement: sap.m.PlacementType.Left,
				contentWidth: "350px",
				title: "Notifications",
			});
			const oFormattedText = new sap.m.FormattedText({
				htmlText: `There ${oPendingLists?.length === 1  ? 'is' : 'are'} ${oPendingLists?.length} pending ${oPendingLists?.length === 1 ? 'invitation' : 'invitations'} to review for ${oPendingLists?.length > 1 ? 'lists' : 'list'}${oPendingLists?.length > 0 ? ':' : ''} <strong>${(oPendingLists.map((oList) => oList.name) || []).join(', ')}</strong>`
			});

			oFormattedText.addStyleClass("sapUiSmallMargin")
			oPopover.addContent(oFormattedText)
			oPopover.openBy(oButton);
		},

		handlePendingListChanged: async function () {
			const sQuery = Lists.getListsPending();
			const aResult = await Client.fetch(sQuery);
			this.oNotificationsModel.setData({ pendingLists: aResult })
		}
	});
  });
  