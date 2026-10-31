/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["jquery.sap.global"],
	function (jQuery) {
		"use strict";

		var mockRequests = {
			_aRequestedKeys: null,
			_sEntryFound: null,
			_aKeys: null,
			_oEntitySet: null,

			/**
			 * MockServer
			 * @public
			 * @returns {Object} MockServer Handler
			 * */
			connectTwoOperations: function () {
				return {
					method: "POST",
					path: new RegExp("(C_RSHMaintenanceOrdOperationTP)(\\(([^/\\?#]+)\\)/?(.*)?)?"),
					response: function (oXhr, sUrlParams) {
						var oRequest = new XMLHttpRequest();

						oRequest.onload = function (oResponse) {
							var oMessageContent = {};
							oMessageContent = oResponse.target.responseHeaders["sap-message"];
							var oHeader = {
								"sap-message": oMessageContent
							};
							oXhr.respondJSON(oResponse.target.status, oHeader, oResponse.target.responseText);
							return true;
						};
						//Communicate the change to Gantt service
						oRequest.open("POST", "/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/" + "C_RSHOperationRelationships", false);
						oRequest.send(oXhr.requestBody);
						return true;
					}
				};
			},
			/**
			 * MockServer
			 * @public
			 * @returns {Object} MockServer Handler
			 * */
			deleteRelationship: function () {
				return {
					method: "DELETE",
					path: new RegExp("(C_RSHMaintenanceOrdOpRelshpTP)\\(([^/\\?#]+)\\)/?(.*)?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						var oRequest = new XMLHttpRequest();
						oRequest.onload = function (oResponse) {
							var oMessageContent = {};
							oMessageContent = oResponse.target.responseHeaders["sap-message"];
							var oHeader = {
								"sap-message": oMessageContent
							};
							oXhr.respondJSON(oResponse.target.status, oHeader, oResponse.target.responseText);
							return true;
						};
						//Communicate the change to Gantt service
						oRequest.open("DELETE", "/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/" + "C_RSHOperationRelationships", false);
						oRequest.send(sKeys);
						return true;
					}
				};
			},
			/**
			 * MockServer
			 * @public
			 * @returns {Object} MockServer Handler
			 * */
			editRelationshipOffset: function () {
				return {
					method: "MERGE",
					path: new RegExp("(C_RSHMaintenanceOrdOpRelshpTP)\\(([^/\\?#]+)\\)/?(.*)?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						var oRequest = new XMLHttpRequest();
						oRequest.onload = function (oResponse) {
							var oMessageContent = {};
							oMessageContent = oResponse.target.responseHeaders["sap-message"];
							var oHeader = {
								"sap-message": oMessageContent
							};
							oXhr.respondJSON(oResponse.target.status, oHeader, oResponse.target.responseText);
							return true;
						};
						var oRequestBody = {};
						oRequestBody.sKeys = sKeys;
						oRequestBody.requestBody = oXhr.requestBody;
						//Communicate the change to Gantt service
						oRequest.open("MERGE", "/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/" + "C_RSHOperationRelationships", false);
						oRequest.send(oRequestBody);
						return true;
					}
				};
			},

			/**
			 * Returns an updated array of handlers for the mockserver, containing the default auto generated handlers
			 * and addicional custom developed handlers.
			 * @param {array} aRequests auto generated handlers of the mockserver
			 * @param {object} thisArg mockserver instance object
			 * @returns {array} array of handlers
			 * @public
			 * */
			getRequests: function (aRequests, thisArg) {
				this.addRequest(aRequests, this.connectTwoOperations(), thisArg);
				this.addRequest(aRequests, this.triggerOrderScheduling(), thisArg);
				this.addRequest(aRequests, this.deleteRelationship(), thisArg);
				this.addRequest(aRequests, this.editRelationshipOffset(), thisArg);
				return aRequests;
			},

			addRequest: function (aRequests, customRequest, thisArg) {
				var oRequest = aRequests.find(function (oItem) {
					return (
						oItem.path.toString() === customRequest.path.toString() &&
						oItem.method.toString().toUpperCase() === customRequest.method.toString().toUpperCase()
					);
				});

				if (oRequest) {
					//override existing request
					oRequest.response = customRequest.response.bind(thisArg);
				} else {
					//add new request
					oRequest = customRequest;
					oRequest.response = customRequest.response.bind(thisArg);
					aRequests.push(oRequest);
				}
			},
			/**
			 * MockServer
			 * @public
			 * @returns {Object} MockServer Handler
			 * */
			triggerOrderScheduling: function () {
				return {
					method: "POST",
					path: new RegExp("(ScheduleMaintenanceOrder)(\\?(.*))?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						// var sMaintOrder = sNavProperty.slice(18, 25);
						var oRequest = new XMLHttpRequest();
						oRequest.onload = function (oResponse) {
							var oMessageContent = {};
							oMessageContent = oResponse.target.responseHeaders["sap-message"];
							var oHeader = {
								"sap-message": oMessageContent
							};
							oXhr.respondJSON(oResponse.target.status, oHeader, oResponse.target.responseText);
							return true;
						};
						//Communicate the change to Gantt service
						oRequest.open("POST", "/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/" + "ScheduleMaintOrder", false);
						oRequest.send(sKeys);
						return true;
					}
				};
			}
		};
		return mockRequests;
	},
	true
);
