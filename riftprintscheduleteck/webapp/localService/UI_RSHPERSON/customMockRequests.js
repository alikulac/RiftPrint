/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[],
	function () {
		"use strict";

		var mockRequests = {
			/**
			 * Returns an updated array of handlers for the mockservers, containing the default
			 * auto generated handlers and additional custom handlers.
			 * @param {Array} aRequests Auto generated handlers of the mockserver
			 * @param {Object} oArg mockserver instance object
			 * @returns {Array} array of handlers
			 * @public
			 * */
			getRequests: function (aRequests, oArg) {
				var aRequestsToAdd = [this.getResourceCalendar(oArg), this.getResource(oArg), this.getResourceDetails(oArg)];
				var aAllRequests = aRequests;
				aAllRequests = aAllRequests.concat(aRequestsToAdd);

				return aAllRequests;
			},

			getResourceCalendar: function (oContext) {
				return {
					method: "GET",
					path: new RegExp("(.*)C_RSHPersonCalendar(.*)"),
					response: function (oResponse) {
						var oXhr = new XMLHttpRequest();
						oXhr.open("GET", "../localService/UI_RSHPERSON/mockdata/C_RSHPersonCalendar.json", false);
						oXhr.send();
						this.rshRespond(oResponse, {
							data: JSON.parse(oXhr.response)
						});
						return true;
					}.bind(oContext)
				};
			},

			getResource: function (oContext) {
				return {
					method: "GET",
					path: new RegExp("(.*)C_RSHPersonTP(.*)"),
					response: function (oResponse) {
						var oXhr = new XMLHttpRequest();
						oXhr.open("GET", "../localService/UI_RSHPERSON/mockdata/C_RSHPersonTP.json", false);
						oXhr.send();
						this.rshRespond(oResponse, {
							data: JSON.parse(oXhr.response)
						});
						return true;
					}.bind(oContext)
				};
			},

			getResourceDetails: function (oContext) {
				return {
					method: "GET",
					path: new RegExp("(.*)C_RSHPersonDetail(.*)"),
					response: function (oResponse) {
						var oXhr = new XMLHttpRequest();
						oXhr.open("GET", "../localService/UI_RSHPERSON/mockdata/C_RSHPersonDetail.json", false);
						oXhr.send();
						this.rshRespond(oResponse, {
							data: JSON.parse(oXhr.response)
						});
						return true;
					}.bind(oContext)
				};
			}
		};
		return mockRequests;
	},
	true
);
