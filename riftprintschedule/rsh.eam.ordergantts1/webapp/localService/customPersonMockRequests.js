/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["jquery.sap.global"],
	function (jQuery) {
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
					response: function (oXhr, sUrlParams) {
						var sUrl = "../localService/mockdataPerson/C_RSHPersonCalendar.json";
						var oResponse = jQuery.sap.sjax({
							url: sUrl
						});
						var oResult = oResponse.data;

						oXhr.respondJSON(
							200,
							{
								"Content-Type": "application/json;charset=utf-8"
							},
							oResult
						);
						return true;
					}.bind(oContext)
				};
			},

			getResource: function (oContext) {
				return {
					method: "GET",
					path: new RegExp("(.*)C_RSHPersonTP(.*)"),
					response: function (oXhr, sUrlParams) {
						var sUrl = "../localService/mockdataPerson/C_RSHPersonTP.json";
						var oResponse = jQuery.sap.sjax({
							url: sUrl
						});
						var oResult = oResponse.data;

						oXhr.respondJSON(
							200,
							{
								"Content-Type": "application/json;charset=utf-8"
							},
							oResult
						);
						return true;
					}.bind(oContext)
				};
			},

			getResourceDetails: function (oContext) {
				return {
					method: "GET",
					path: new RegExp("(.*)C_RSHPersonDetail(.*)"),
					response: function (oXhr, sUrlParams) {
						var sUrl = "../localService/mockdataPerson/C_RSHPersonDetail.json";
						var oResponse = jQuery.sap.sjax({
							url: sUrl
						});
						var oResult = oResponse.data;

						oXhr.respondJSON(
							200,
							{
								"Content-Type": "application/json;charset=utf-8"
							},
							oResult
						);
						return true;
					}.bind(oContext)
				};
			}
		};
		return mockRequests;
	},
	true
);
