sap.ui.define([], function () {
    "use strict";

    const COOKIE_NAME = "user_role";
    const ADMIN_ROLE = "admin";
    const READER_ROLE = "reader";
    const WRITER_ROLE = "writer";

    return {
        getCookieValue: function () {
            return document.cookie.match('(^|;)\\s*' + COOKIE_NAME + '\\s*=\\s*([^;]+)')?.pop() || '';
        },

        isAuthorized: function () {
            let role = this.getCookieValue();
            return (role === ADMIN_ROLE || role === WRITER_ROLE);
        },

        isAdmin: function () {
            let role = this.getCookieValue();
            return role === ADMIN_ROLE;
        },

        hasCookie: function () {
            return document.cookie.split(';').some((cookie) => cookie.trim().startsWith(COOKIE_NAME + '='));
        }
    };
});