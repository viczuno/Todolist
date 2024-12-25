sap.ui.define([], function(){
    "use strict";

    return {
        fetch: async (endpoint, method = 'GET', body = null) => {

            let result;
            try {
                result = await fetch(
                    `http://localhost:8000/${endpoint}`,
                    {
                        method: method,
                        body: body ? JSON.stringify(body) : null,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                        },
                        credentials: 'include',
                        mode: 'cors'
                    }
                );
            } catch (e) {
                console.error(e);
            }
            return result;
        },
    }
})