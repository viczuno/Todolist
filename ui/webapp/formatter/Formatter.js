sap.ui.define([
    "todoapp/util/cookie/GetUserRole"
], function (GetUserRole) {
    "use strict";

    return {
        hasWriterAdminPer: function () {
            return GetUserRole.isAuthorized();
        },

        getRole: function () {
            return GetUserRole.getCookieValue().toUpperCase();
        },

        isAdmin: function () {
            return GetUserRole.isAdmin();
        },

        hasCookie: function () {
            return GetUserRole.hasCookie();
        },

        loginButton: function () {
            return !GetUserRole.hasCookie();
        },

        formatInformation: function (value) {
            return value || "N/A";
        },

        formatTags: function (aTags) {
            return aTags && aTags.length > 0 ? aTags.join(", ") : "N/A";
        },

        formatListStatus: function (data) {
            if (!data || data.length === 0) {
                return "There are not any lists";
            }

            if (GetUserRole.isAdmin()) {
                return "All lists in the application:";
            }

            return "Your personal lists:";
        },

        calculateCompletionPercentage: function (data) {
            if (!data || data.length === 0) {
                return 0;
            }
            const totalTodos = data.length;
            const completedTodos = data.filter(todo => todo.completed).length;
            return (completedTodos / totalTodos) * 100;
        },

        displayCompletionPercentage: function (data) {
            if (!data || data.length === 0) {
                return "0%";
            }
            const totalTodos = data.length;
            const completedTodos = data.filter(todo => todo.completed).length;
            return `${((completedTodos / totalTodos) * 100).toFixed(2)}%`;
        },

        isCompleted: function (completed) {
            return completed ? "Yes" : "No";
        }
    };
});