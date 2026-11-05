/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/ui/core/util/MockServer", "sap/base/util/deepClone"],
	function (MockServer, deepClone) {
		"use strict";

		var mockRequests = {
			_aRequestedKeys: null,
			_sEntryFound: null,
			_aKeys: null,
			_oEntitySet: null,

			convertDueToDispatch: function () {
				return {
					method: "POST",
					path: new RegExp("I_MaintOrderOperationTPSetdispatch(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var that = this;

						//First fetch all existing entries for the C_RSHOrdersAndOperations entity
						var oResponse = mockRequests._getAllMockEntriesforEntitySet.call(that, "C_RSHOrdersAndOperations");

						if (!oResponse.success || !oResponse.data.d.results[1]) {
							// respond negative - no entity found
							oXhr.respond(404);
						}
						var str = decodeURIComponent(sUrlParams);
						str = str.substring(1);
						var data = {};

						var keyValArray = str.split("&");
						keyValArray.forEach(function (row) {
							var rowArr = row.split("=");
							data[rowArr[0]] = rowArr[1];
						});
						var maintenanceOrder = data.MaintenanceOrder.replace("'", "");
						maintenanceOrder = maintenanceOrder.slice(0, -1);
						var maintenanceOrderOperation = data.MaintenanceOrderOperation.replace("'", "");
						maintenanceOrderOperation = maintenanceOrderOperation.slice(0, -1);
						var oEntry;
						if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0011") {
							oEntry = oResponse.data.d.results[1];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0020") {
							oEntry = oResponse.data.d.results[2];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0050") {
							oEntry = oResponse.data.d.results[5];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0060") {
							oEntry = oResponse.data.d.results[6];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0070") {
							oEntry = oResponse.data.d.results[7];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0080") {
							oEntry = oResponse.data.d.results[8];
						} else {
							oXhr.respond(404);
						}
						//take its key
						var sKeys = "ID='" + oEntry.ID + "'";
						//fetch the corresponding entry by key from the mock server
						var oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);
						//change its status
						if (oMockEntry.entry.ProcessingStatus !== 40) {
							oMockEntry.entry.ProcessingStatus = 30;
							oMockEntry.entry.ProcessingStatusText = "Dispatched";
						}

						this.rshRespond(oXhr, {
							data: oMockEntry
						});
					}
				};
			},

			convertDispatchToDue: function () {
				return {
					method: "POST",
					path: new RegExp("I_MaintOrderOperationTPUnsetdispatch(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var that = this;
						//First fetch all existing entries for the C_RSHOrdersAndOperations entity
						var oResponse = mockRequests._getAllMockEntriesforEntitySet.call(that, "C_RSHOrdersAndOperations", oXhr, sUrlParams);

						if (!oResponse.success || !oResponse.data.d.results[0]) {
							// respond negative - no entity found
							oXhr.respond(404);
						}

						var str = decodeURIComponent(sUrlParams);
						str = str.substring(1);
						var data = {};

						var keyValArray = str.split("&");
						keyValArray.forEach(function (row) {
							var rowArr = row.split("=");
							data[rowArr[0]] = rowArr[1];
						});
						var maintenanceOrder = data.MaintenanceOrder.replace("'", "");
						maintenanceOrder = maintenanceOrder.slice(0, -1);
						var maintenanceOrderOperation = data.MaintenanceOrderOperation.replace("'", "");
						maintenanceOrderOperation = maintenanceOrderOperation.slice(0, -1);
						var oEntry;
						if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0011") {
							oEntry = oResponse.data.d.results[1];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0020") {
							oEntry = oResponse.data.d.results[2];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0050") {
							oEntry = oResponse.data.d.results[5];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0060") {
							oEntry = oResponse.data.d.results[6];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0070") {
							oEntry = oResponse.data.d.results[7];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0090") {
							oEntry = oResponse.data.d.results[9];
						} else {
							oXhr.respond(404);
						}

						var sKeys = "ID='" + oEntry.ID + "'";
						//fetch the corresponding entry by key from the mock server
						var oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);
						//change its status
						if (oMockEntry.entry.ProcessingStatus !== 40) {
							oMockEntry.entry.ProcessingStatus = 20;
							oMockEntry.entry.ProcessingStatusText = "Due";
						}

						this.rshRespond(oXhr, {
							data: oMockEntry
						});
					}
				};
			},

			changeOperationAssignment: function () {
				return {
					method: "POST",
					path: new RegExp("I_MaintOrderOperationTPChangeassgmt(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var oResponse = mockRequests._getAllMockEntriesforEntitySet.call(this, "C_RSHOrdersAndOperations", oXhr, sUrlParams);

						if (!oResponse.success || !oResponse.data.d.results[1]) {
							// respond negative - no entity found
							oXhr.respond(404);
						}

						var str = decodeURIComponent(sUrlParams);
						str = str.substring(1);
						var data = {};

						var keyValArray = str.split("&");
						keyValArray.forEach(function (row) {
							var rowArr = row.split("=");
							data[rowArr[0]] = rowArr[1];
						});
						var maintenanceOrder = data.MaintenanceOrder.slice(1, -1);
						var maintenanceOrderOperation = data.MaintenanceOrderOperation.slice(1, -1);
						var maintenanceOrderOperationWorkCenter = data.OperationWorkCenter.slice(1, -1);
						var maintenanceOrderOperationPersonResponsibleId = data.OperationPersonResponsible.slice(1, -1);
						var oEntry;
						if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0011") {
							oEntry = oResponse.data.d.results[1];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0020") {
							oEntry = oResponse.data.d.results[2];
						} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0050") {
							oEntry = oResponse.data.d.results[5];
						} else if (maintenanceOrder === "4018844" && maintenanceOrderOperation === "0011") {
							oEntry = oResponse.data.d.results[12];
						} else {
							oXhr.respond(404);
						}

						var sKeys = "ID='" + oEntry.ID + "'";
						var oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);

						oMockEntry.entry.MainWorkCenter = maintenanceOrderOperationWorkCenter;
						oMockEntry.entry.OperationPersonResponsible = maintenanceOrderOperationPersonResponsibleId;

						this.rshRespond(oXhr, {
							data: oMockEntry
						});
					}
				};
			},

			changeSubOperationAssignment: function () {
				return {
					method: "POST",
					path: new RegExp("I_MaintOrderSubOperationTPChangeassgmt(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var oResponse = mockRequests._getAllMockEntriesforEntitySet.call(this, "C_RSHOrdersAndOperations", oXhr, sUrlParams);

						if (!oResponse.success || !oResponse.data.d.results[1]) {
							// respond negative - no entity found
							oXhr.respond(404);
						}

						var str = decodeURIComponent(sUrlParams);
						str = str.substring(1);
						var data = {};

						var keyValArray = str.split("&");
						keyValArray.forEach(function (row) {
							var rowArr = row.split("=");
							data[rowArr[0]] = rowArr[1];
						});
						var maintenanceOrder = data.MaintenanceOrder.slice(1, -1);
						var maintenanceOrderOperation = data.MaintenanceOrderOperation.slice(1, -1);
						var maintenanceOrderOperationWorkCenter = data.OperationWorkCenter.slice(1, -1);
						var maintenanceOrderOperationPersonResponsibleId = data.OperationPersonResponsible.slice(1, -1);
						var oEntry;
						if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0030") {
							oEntry = oResponse.data.d.results[3];
						} else {
							oXhr.respond(404);
						}

						var sKeys = "ID='" + oEntry.ID + "'";
						var oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);

						oMockEntry.entry.MainWorkCenter = maintenanceOrderOperationWorkCenter;
						oMockEntry.entry.OperationPersonResponsible = maintenanceOrderOperationPersonResponsibleId;

						this.rshRespond(oXhr, {
							data: oMockEntry
						});
					}
				};
			},

			getFilteredWorkCenterPersonResp: function () {
				return {
					method: "GET",
					path: new RegExp("(C_RSHWrkCtrPersonResponsibleVH)(.*)"),
					entitySetName: "C_RSHWrkCtrPersonResponsibleVH",

					response: function (oXhr, sURL, sURLAgain, sRequestParams) {
						var oQueryParams = new URLSearchParams(sURLAgain);
						var sSearchText = oQueryParams.get("search");
						var sFilterText = oQueryParams.get("$filter");
						var bWorkCenterFilter = false;
						if (sFilterText) {
							bWorkCenterFilter = sFilterText.includes("WorkCenterInternalID");
						}
						var oResult = this._oMockdata.C_RSHWrkCtrPersonResponsibleVH;
						var oResponse = [];

						if (bWorkCenterFilter) {
							var sWorkCenterInternalId = sFilterText.slice(sFilterText.indexOf("'") + 1, sFilterText.indexOf("'", sFilterText.indexOf("'") + 1));
							oResult.forEach(function (oItem) {
								if (oItem.WorkCenterInternalID === sWorkCenterInternalId) {
									if (sSearchText) {
										if (
											oItem.OperationPersonRespName.includes(sSearchText) ||
											oItem.WorkCenter.includes(sSearchText) ||
											oItem.RespyMgmtFunctionDescription.includes(sSearchText)
										) {
											oResponse.push(oItem);
										}
									} else {
										oResponse.push(oItem);
									}
								}
							});
						}

						if (sSearchText && !bWorkCenterFilter) {
							oResult.forEach(function (oItem) {
								if (
									oItem.OperationPersonRespName.includes(sSearchText) ||
									oItem.WorkCenter.includes(sSearchText) ||
									oItem.RespyMgmtFunctionDescription.includes(sSearchText)
								) {
									oResponse.push(oItem);
								}
							});
						}

						// The suggestion requires an array of "results", so the binding understands the response
						var oMockEntry = {
							results: oResponse
						};
						this.rshRespond(oXhr, {
							data: oMockEntry
						});
						return true;
					}
				};
			},

			triggerChangeScheduling: function () {
				return {
					method: "POST",
					path: new RegExp("I_MaintOrderOperationTPChangescheduling(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var that = this;
						var oHeader = {};
						//First fetch all existing entries for the C_RSHOrdersAndOperations entity
						var oResponse = mockRequests._getAllMockEntriesforEntitySet.call(that, "C_RSHOrdersAndOperations", oXhr, sUrlParams);

						if (!oResponse.success || !oResponse.data.d.results[1]) {
							// respond negative - no entity found
							oXhr.respond(404);
						}
						if (sUrlParams.includes("Schedulingstartconstraint='%20'")) {
							var str = decodeURIComponent(sUrlParams);
							str = str.substring(1);
							var data = {};

							var keyValArray = str.split("&");
							keyValArray.forEach(function (row) {
								var rowArr = row.split("=");
								data[rowArr[0]] = rowArr[1];
							});
							var maintenanceOrder = data.MaintenanceOrder.replace("'", "");
							maintenanceOrder = maintenanceOrder.slice(0, -1);
							var maintenanceOrderOperation = data.MaintenanceOrderOperation.replace("'", "");
							maintenanceOrderOperation = maintenanceOrderOperation.slice(0, -1);
							var oEntry;
							if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0050") {
								oEntry = oResponse.data.d.results[5];
							} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0070") {
								oEntry = oResponse.data.d.results[7];
							} else if (maintenanceOrder === "4018843" && maintenanceOrderOperation === "0090") {
								oEntry = oResponse.data.d.results[9];
							} else {
								oXhr.respond(404);
							}
							//take its key
							var sKeys = "ID='" + oEntry.ID + "'";
							//fetch the corresponding entry by key from the mock server
							var oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);
							//change its status
							if (oMockEntry.entry.OpBscStartDateConstraintType === "1") {
								oMockEntry.entry.OpBscStartDateConstraintType = "";
								oMockEntry.entry.OrderOpStartConstraintDateTime = null;
							}
						} else {
							oEntry = oResponse.data.d.results[1];
							sKeys = "ID='" + oEntry.ID + "'";
							oMockEntry = mockRequests._getSingleEntity.call(this, "C_RSHOrdersAndOperations", sKeys);

							/*	This is a common branch for both Start date change and DnD of operation test scenarios
								PlannedStartDate is required for Start date change tests
								OrderOperationStartDateTime, OrderOperationEndDateTime are required for DnD Op tests */
							oMockEntry.entry.PlannedStartDate = mockRequests._convertToJSONDate(new Date());
							oMockEntry.entry.OrderOperationStartDateTime = mockRequests._convertToJSONDate(new Date(1617993000000));
							oMockEntry.entry.OrderOperationEndDateTime = mockRequests._convertToJSONDate(new Date(1618338600000));
							if (!this.bMessageReturned) {
								var oMessageContent = {
									code: "RSH_LVLING_CONFLICTS/" + Math.floor(Math.random() * 100) + 1, // Random code :)
									message: "Test message to check message manager",
									severity: "success",
									target: "/#TRANSIENT#",
									details: []
								};
								oHeader = {
									"sap-message": JSON.stringify(oMessageContent)
								};
								this.bMessageReturned = true;
							}
						}

						this.rshRespond(oXhr, {
							data: oMockEntry
						});
					}
				};
			},

			_convertToJSONDate: function (dt) {
				// var dt = new Date(strDate);
				var newDate = new Date(
					Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), dt.getMinutes(), dt.getSeconds(), dt.getMilliseconds())
				);
				return "/Date(" + newDate.getTime() + ")/";
			},

			/**
			 * Returns Mockdata for the given EntitySetName with Query operations aplied
			 * @private
			 * @param {string} sEntitySetName EntitySet Name
			 * @returns {Object} result object
			 * */
			_getAllMockEntriesforEntitySet: function (sEntitySetName) {
				var oResponse = {
					success: false,
					data: {
						d: {
							results: []
						}
					}
				};

				try {
					var aData = this._oMockdata[sEntitySetName];

					var oFilteredData = {
						results: deepClone(aData)
					};

					oResponse.success = true;
					oResponse.data.d = oFilteredData;
				} catch (e) {
					oResponse.success = false;
				}

				return oResponse;
			},

			/**
			 * Gets a single entity matching the given keys
			 * @private
			 * @param {string} sEntitySetName entitySet name
			 * @param {string} _sKeys entity keys
			 * @returns {Object} entity data matching the given keys
			 * */
			_getSingleEntity: function (sEntitySetName, _sKeys) {
				this._aRequestedKeys = null;
				this._sEntryFound = null;
				this._aKeys = null;
				this._oEntitySet = null;

				var that = this;
				var sKeys = _sKeys;

				sKeys = decodeURIComponent(sKeys);
				this._oEntitySet = that._mEntitySets[sEntitySetName];
				this._aKeys = this._oEntitySet.keys;
				// split keys
				this._aRequestedKeys = sKeys.split(",");

				// check number of keys to be equal to the entity keys and validates keys type for quotations
				if (this._aRequestedKeys.length !== this._aKeys.length) {
					that._logAndThrowMockServerCustomError(400, that._oErrorMessages.INVALID_KEY_PREDICATE_QUANTITY);
				}
				that._isRequestedKeysValid(this._oEntitySet, this._aRequestedKeys);
				if (this._aRequestedKeys.length === 1 && !this._aRequestedKeys[0].split("=")[1]) {
					this._aRequestedKeys = [this._aKeys[0] + "=" + this._aRequestedKeys[0]];
				}
				return mockRequests._getEntitySetByKeys(
					that._oMockdata[sEntitySetName],
					this._aRequestedKeys,
					this._aKeys,
					this._oEntitySet,
					that._trim,
					that
				);
			},

			_getEntitySetByKeys: function (aMockDataAll, aRequestedKeys, aKeys, oEntitySet, fTream) {
				var that = this;
				// check each key for existence and value
				for (var j = 0; j < aMockDataAll.length; j++) {
					for (var i = 0; i < aRequestedKeys.length; i++) {
						var aKeyVal = aRequestedKeys[i].split("=");
						var sKey = fTream(aKeyVal[0]);
						//key doesn't match, continue to next entry
						if (aKeys.indexOf(sKey) === -1) {
							return true; // = continue
						}

						var sNewValue = fTream(aKeyVal[1]);
						var sOrigiValue = aMockDataAll[j][sKey];

						switch (oEntitySet.keysType[sKey]) {
							case "Edm.String":
								sNewValue = sNewValue.replace(/^\'|\'$/g, "");
								break;
							case "Edm.DateTime":
								sOrigiValue = that._getDateTime(sOrigiValue);
								break;
							case "Edm.SByte":
								if (!that._isValidNumber(sNewValue)) {
									return false; // = break
								}
								sNewValue = parseFloat(sNewValue);
								break;
							case "Edm.Guid":
								sNewValue = sNewValue.replace(/^guid\'|\'$/g, "");
								break;
							case "Edm.Boolean":
								if (["true", "false"].indexOf(sNewValue) === -1) {
									that._logAndThrowMockServerCustomError(400, that._oErrorMessages.INVALID_KEY_TYPE, sKey);
								}
								sNewValue = sNewValue === "true";
								break;
							default:
								sNewValue = sNewValue;
						}
						//compare the current entity resord value with the requested value
						if (sOrigiValue === sNewValue) {
							//if entry found stop looping
							this._sEntryFound = true;
							break; // = continue
						} else {
							//if not found, continue looping
							this._sEntryFound = false;
						}
					}
					//if entry found stop looping
					if (this._sEntryFound === true) {
						break;
					}
				}
				if (this._sEntryFound) {
					this._oFoundEntry = {
						index: j,
						entry: aMockDataAll[j]
					};
					return this._oFoundEntry; // = break
				} else {
					return false;
				}
			},

			_deleteRelationshipEntry: function (oRequestBody, sEntityName, oContext) {
				var oRelationshipEntity = {};
				var __metadata = {};

				oRelationshipEntity.__metadata = {};
				oRelationshipEntity.NetworkActivityRelationType = mockRequests._getExternalRelationshipType(oRequestBody.substring(236, 238));
				__metadata.id =
					"C_RSHOperationRelationships(MaintenanceOrder='undefined',PredecessorOrder='" +
					oRequestBody.substring(23, 30) +
					"',PredecessorOrderOperation='" +
					oRequestBody.substring(59, 63) +
					"',SuccessorOrder='" +
					oRequestBody.substring(165, 172) +
					"',SuccessorOrderOperation='" +
					oRequestBody.substring(202, 206) +
					"',NetworkActivityRelationType='" +
					oRelationshipEntity.NetworkActivityRelationType +
					"')";

				__metadata.uri = __metadata.id;
				__metadata.type = "RSH_EAM_ORDER_GANTT_SRV.C_RSHOperationRelationshipsType";
				oRelationshipEntity.__metadata = __metadata;
				var iDoesRelationshipExist = mockRequests._isRelationshipPresent(
					oContext._oMockdata[sEntityName],
					oRelationshipEntity.__metadata.id,
					oRelationshipEntity.NetworkActivityRelationType
				);

				var oResponse = {};
				oResponse.header = {};
				oResponse.data = {};

				var oMessageContent = {};

				if (iDoesRelationshipExist === -1) {
					oResponse.statusCode = 400;

					oMessageContent = {
						error: {
							code: "CN/824",
							message: "Relationship from doesn't exists",
							target: "",
							severity: "error",
							transition: true,
							details: []
						}
					};
					oResponse.header = {
						"Content-Type": "application/json;charset=utf-8"
					};

					oResponse.payload = oMessageContent;
					return oResponse;
				}

				oMessageContent = {
					code: "IW/080",
					message: "Order saved with number " + oRequestBody.substring(23, 30),
					target: "",
					severity: "success",
					transition: true,
					details: []
				};
				oResponse.statusCode = 201;
				oResponse.header = {
					"Content-Type": "application/json;charset=utf-8",
					"sap-message": JSON.stringify(oMessageContent)
				};
				oContext._oMockdata[sEntityName].splice(iDoesRelationshipExist, 1);
				oResponse.data = oRelationshipEntity;
				return oResponse;
			},

			deleteRelationships: function () {
				return {
					method: "DELETE",
					path: new RegExp("(C_RSHOperationRelationships)(\\(([^/\\?#]+)\\)/?(.*)?)?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						var that = this;
						var oRequestBody = oXhr.requestBody;
						var oResponse = mockRequests._deleteRelationshipEntry(oRequestBody, sEntityName, that);
						this.rshRespond(oXhr, oResponse);
						return true;
					}
				};
			},

			editRelationshipOffset: function () {
				return {
					method: "MERGE",
					path: new RegExp("(C_RSHOperationRelationships)(\\(([^/\\?#]+)\\)/?(.*)?)?"),
					response: function (oXhr, sEntityName) {
						var that = this;
						var oRequestBody = {};
						oRequestBody.sRequestBody = oXhr.requestBody.sKeys;
						oRequestBody.OpRelshpOffsetDuration = JSON.parse(oXhr.requestBody.requestBody).OpRelshpOffsetDuration;
						oRequestBody.OpRelshpOffsetDurationUnit = JSON.parse(oXhr.requestBody.requestBody).OpRelshpOffsetDurationUnit;
						var oResponse = mockRequests._editRelationshipOffsetEntry(oRequestBody, sEntityName, that);
						this.rshRespond(oXhr, oResponse);
						return true;
					}
				};
			},

			/**
			 * Called by editRelationshipOffset to process mock request
			 * @private
			 * @param {Object} oRequestBody
			 * @param {String} sEntityName
			 * @param {Object} oContext
			 * @returns {Object} MockServer Handler
			 */
			_editRelationshipOffsetEntry: function (oRequestBody, sEntityName, oContext) {
				var oRelationshipEntity = {};
				var __metadata = {};
				var iRelShapeIndex = oRequestBody.sRequestBody.substr(59, 4) === "0030" || oRequestBody.sRequestBody.substr(59, 4) === "0050" ? 1 : 0;
				oRelationshipEntity.__metadata = {};
				__metadata.id =
					"C_RSHOperationRelationships(PredecessorOrder='" +
					oRequestBody.sRequestBody.substr(23, 7) +
					"',PredecessorOrderOperation='" +
					oRequestBody.sRequestBody.substr(59, 4) +
					"',SuccessorOrder='" +
					oRequestBody.sRequestBody.substr(165, 7) +
					"',SuccessorOrderOperation='" +
					oRequestBody.sRequestBody.substr(202, 4) +
					"')";
				__metadata.uri = __metadata.id;
				__metadata.type = "RSH_EAM_ORDER_GANTT_SRV.C_RSHOperationRelationshipsType";
				oRelationshipEntity.__metadata = __metadata;
				oRelationshipEntity.NetworkActivityRelationType = mockRequests._getExternalRelationshipType(oRequestBody.OrderOpRelationshipIntType);

				var oResponse = {};
				oResponse.header = {};
				oResponse.data = {};

				var oMessageContent = {};

				oMessageContent = {
					code: "IW/080",
					message: "Order saved with number " + oRequestBody.sRequestBody.substr(18, 12),
					target: "",
					severity: "success",
					transition: true,
					details: []
				};
				oResponse.statusCode = 201;
				oResponse.header = {
					"Content-Type": "application/json;charset=utf-8",
					"sap-message": JSON.stringify(oMessageContent)
				};

				oRelationshipEntity.OpRelshpOffsetDuration = Number.parseFloat(oRequestBody.OpRelshpOffsetDuration).toFixed(1);
				oRelationshipEntity.OpRelshpOffsetDurationUnit = oRequestBody.OpRelshpOffsetDurationUnit;
				oContext._oMockdata[sEntityName][iRelShapeIndex].OpRelshpOffsetDuration = oRelationshipEntity.OpRelshpOffsetDuration;
				oContext._oMockdata[sEntityName][iRelShapeIndex].OpRelshpOffsetDurationUnit = oRelationshipEntity.OpRelshpOffsetDurationUnit;

				oResponse.data = oRelationshipEntity;

				return oResponse;
			},

			createRelationships: function () {
				return {
					method: "POST",
					path: new RegExp("(C_RSHOperationRelationships)(\\(([^/\\?#]+)\\)/?(.*)?)?"),
					response: function (oXhr, sEntityName) {
						var that = this;
						var oRequestBody = JSON.parse(oXhr.requestBody);
						var oResponse = mockRequests._createNewRelationshipEntry(oRequestBody, sEntityName, that);
						this.rshRespond(oXhr, oResponse);
						return true;
					}
				};
			},

			_createNewRelationshipEntry: function (oRequestBody, sEntityName, oContext) {
				var oRelationshipEntity = {};
				var __metadata = {};

				oRelationshipEntity.__metadata = {};

				__metadata.id =
					"C_RSHOperationRelationships(PredecessorOrder='" +
					oRequestBody.MaintenanceOrder +
					"',PredecessorOrderOperation='" +
					oRequestBody.MaintenanceOrderOperation +
					"',SuccessorOrder='" +
					oRequestBody.RelatedMaintenanceOrder +
					"',SuccessorOrderOperation='" +
					oRequestBody.RelatedMaintOrderOperation +
					"')";
				__metadata.uri = __metadata.id;
				__metadata.type = "RSH_EAM_ORDER_GANTT_SRV.C_RSHOperationRelationshipsType";
				oRelationshipEntity.__metadata = __metadata;
				oRelationshipEntity.NetworkActivityRelationType = mockRequests._getExternalRelationshipType(oRequestBody.OrderOpRelationshipIntType);

				var iDoesRelationshipExist = mockRequests._isRelationshipPresent(
					oContext._oMockdata[sEntityName],
					oRelationshipEntity.__metadata.id,
					oRelationshipEntity.NetworkActivityRelationType
				);

				var oResponse = {};
				oResponse.header = {};
				oResponse.data = {};

				var oMessageContent = {};

				if (iDoesRelationshipExist !== -1) {
					oResponse.statusCode = 400;

					oMessageContent = {
						error: {
							code: "CN/824",
							message:
								"Relationship from " +
								oRequestBody.MaintenanceOrder +
								" " +
								oRequestBody.MaintenanceOrderOperation +
								" to " +
								oRequestBody.RelatedMaintenanceOrder +
								" " +
								oRequestBody.RelatedMaintOrderOperation +
								" already exists",
							target: "",
							severity: "error",
							transition: true,
							details: []
						}
					};
					oResponse.header = {
						"Content-Type": "application/json;charset=utf-8"
					};

					oResponse.payload = oMessageContent;
					return oResponse;
				}

				oMessageContent = {
					code: "IW/080",
					message: "Order saved with number " + oRequestBody.MaintenanceOrder,
					target: "",
					severity: "success",
					transition: true,
					details: []
				};
				oResponse.statusCode = 201;
				oResponse.header = {
					"Content-Type": "application/json;charset=utf-8",
					"sap-message": JSON.stringify(oMessageContent)
				};
				oRelationshipEntity.PredecessorOrder = oRequestBody.MaintenanceOrder;
				oRelationshipEntity.PredecessorOrderOperation = oRequestBody.MaintenanceOrderOperation;
				oRelationshipEntity.SuccessorOrder = oRequestBody.RelatedMaintenanceOrder;
				oRelationshipEntity.SuccessorOrderOperation = oRequestBody.RelatedMaintOrderOperation;
				oRelationshipEntity.RelationshipIsExplicit = "X";
				oRelationshipEntity.PredecessorOrderOperationRowID = "00000" + oRequestBody.MaintenanceOrder + oRequestBody.MaintenanceOrderOperation;
				oRelationshipEntity.SuccessorOrderOperationRowID = "00000" + oRequestBody.RelatedMaintenanceOrder + oRequestBody.RelatedMaintOrderOperation;
				oContext._oMockdata[sEntityName] = oContext._oMockdata[sEntityName].concat(oRelationshipEntity);

				oResponse.data = oRelationshipEntity;

				return oResponse;
			},

			_isRelationshipPresent: function (aMockdata, sMetadataId, sRelationshipType) {
				for (var i = 0; i < aMockdata.length; i++) {
					if (aMockdata[i].__metadata.id.indexOf(sMetadataId) !== -1 && aMockdata[i].NetworkActivityRelationType === sRelationshipType) {
						return i;
					}
				}
				return -1;
			},

			_getExternalRelationshipType: function (sRelationshipType) {
				switch (sRelationshipType) {
					case "NF":
						return "FinishToStart";
					case "AF":
						return "StartToStart";
					case "EF":
						return "FinishToFinish";
					case "SF":
						return "StartToFinish";
					default:
						return " ";
				}
			},

			/**
			 * Trigger Order Scheduling button mock server request.
			 * */
			_orderScheduling: function (oRequestBody, sEntityName, oContext) {
				var oResponse = {};
				oResponse.header = {};
				oResponse.data = {};
				var oMessageContent = {};
				oMessageContent = {
					code: "IW/080",
					message: "Order saved with number " + oRequestBody.MaintenanceOrder,
					target: "",
					severity: "success",
					transition: true,
					details: []
				};

				var oMockEntries = oContext._oMockdata.C_RSHOrdersAndOperations;
				var oMockEntry = oMockEntries[0];
				oMockEntry.OrderStartDateTime = mockRequests._convertToJSONDate(new Date());
				oMockEntry.OrderStartEndTime = mockRequests._convertToJSONDate(new Date());

				oResponse.statusCode = 200;
				oResponse.header = {
					"Content-Type": "application/json;charset=utf-8",
					"sap-message": JSON.stringify(oMessageContent)
				};
				oResponse.data = oMockEntry;

				return oResponse;
			},

			triggerOrdScheduling: function () {
				return {
					method: "POST",
					path: new RegExp("(ScheduleMaintOrder)(\\?(.*))?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						var oRequestBody = oXhr.requestBody;
						var oResponse = mockRequests._orderScheduling(oRequestBody, sEntityName, this);
						this.rshRespond(oXhr, oResponse);
						return true;
					}
				};
			},

			_changeOrderScheduling: function (oRequestBody, oContext) {
				var oResponse = {};
				oResponse.header = {};
				oResponse.data = {};
				var oMessageContent = {};
				oMessageContent = {
					code: "IW/080",
					message: "Order saved with number " + oRequestBody.MaintenanceOrder,
					target: "",
					severity: "success",
					transition: true,
					details: []
				};

				var oMockEntries = oContext._oMockdata.C_RSHOrdersAndOperations;
				var oMockEntry = oMockEntries[0];
				oMockEntry.OrderStartDateTime = mockRequests._convertToJSONDate(new Date(1617993000000));
				oMockEntry.OrderEndDateTime = mockRequests._convertToJSONDate(new Date(1618338600000));

				oResponse.statusCode = 200;
				oResponse.header = {
					"Content-Type": "application/json;charset=utf-8",
					"sap-message": JSON.stringify(oMessageContent)
				};
				oResponse.data = oMockEntry;

				return oResponse;
			},

			/**
			 * MockServer
			 * @public
			 * @returns {Object} MockServer Handler
			 * */
			dragAndDropAnOrder: function () {
				return {
					method: "POST",
					path: new RegExp("C_ObjPgMaintOrderChangescheduling(\\?(.*))?"),
					response: function (oXhr, sEntityName, sKeys, sNavProperty, sUrlParams) {
						var sUrlSubStringMaintOrder = oXhr.url.split("&")[4];
						oXhr.requestBody = oXhr.requestBody ? oXhr.requestBody : {};
						oXhr.requestBody.MaintenanceOrder = sUrlSubStringMaintOrder.replace(/\D/g, "");
						var that = this;
						var oResponse = mockRequests._changeOrderScheduling(oXhr.requestBody, that);
						oResponse.header = {
							"sap-message": oResponse.header["sap-message"]
						};
						this.rshRespond(oXhr, oResponse);
						return true;
					}
				};
			},

			assignNewWorkCenter: function () {
				return {
					method: "POST",
					path: new RegExp("(C_RSHUserVariantWithTeam)(\\(([^/\\?#]+)\\)/?(.*)?)?"),
					entitySetName: "C_RSHUserVariantWithTeam",

					response: function (oXhr, sEntitySetName, group2, sKeys, sNavName) {
						var oRespondData = null;
						var oRespondHeader = null;

						var oEntity = mockRequests._initNewWorkCenterEntity(oXhr);
						var sUri =
							"/sap/opu/odata/sap/RSH_EAM_ORDER_GANTT_SRV/C_RSHUserVariantWithTeam(WorkCenterInternalID='" +
							oEntity.WorkCenterInternalID +
							"',WorkCenterTypeCode='" +
							oEntity.WorkCenterTypeCode +
							"')";

						var oMessageContent;

						if (oXhr.requestBody.search('"WorkCenter":"RSH_010"') !== -1) {
							oMessageContent = {
								code: "IW/053",
								message: "Work center RSH_010 plant 0001 not allowed for Plant Maintenance",
								severity: "Error",
								transition: "false",
								target:
									"/C_RSHUserVariantWithTeam(WorkCenterInternalID='" +
									oEntity.WorkCenterInternalID +
									"',WorkCenterTypeCode='" +
									oEntity.WorkCenterTypeCode +
									"')/WorkCenter",
								details: []
							};
						} else {
							oMessageContent = {
								code: "RSH_USER_VARIANT/008",
								message: "Work Center " + oEntity.WorkCenterInternalID + " was added.",
								severity: "success",
								transition: "false",
								target:
									"/C_RSHUserVariantWithTeam(WorkCenterInternalID='" +
									oEntity.WorkCenterInternalID +
									"',WorkCenterTypeCode='" +
									oEntity.WorkCenterTypeCode +
									"')/WorkCenter",
								details: []
							};

							//add the new enty to mockdata set
							this._oMockdata.C_RSHUserVariantWithTeam = this._oMockdata.C_RSHUserVariantWithTeam.concat([oEntity]);
						}
						// Build up the response data
						oRespondHeader = {
							"Content-Type": "application/json;charset=utf-8",
							"sap-message": JSON.stringify(oMessageContent)
						};
						oRespondData = {
							d: oEntity,
							uri: sUri
						};
						this.rshRespond(oXhr, {
							payload: oRespondData,
							header: oRespondHeader
						});
					}
				};
			},
			_initNewWorkCenterEntity: function (oXhr) {
				var oEntity = JSON.parse(oXhr.requestBody);
				var sRootUri = "/sap/opu/odata/sap/RSH_EAM_ANALYZE_SRV/";
				var sEntitySetName = "C_RSHUserVariantWithTeam";
				if (oEntity) {
					var sKeyString = "(WorkCenterInternalID='" + oEntity.WorkCenterInternalID + "',WorkCenterTypeCode='" + oEntity.WorkCenterTypeCode + "')";
					oEntity.__metadata = oEntity.__metadata || {};
					// add the metadata for the entry
					oEntity.__metadata.id = sRootUri + sEntitySetName + sKeyString;
					oEntity.__metadata.type = "RSH_EAM_ANALYZE_SRV.C_RSHUserVariantWithTeamType";
					oEntity.__metadata.uri = sRootUri + sEntitySetName + sKeyString;
					oEntity.to_WorkCenter = {
						__deferred: {
							uri: sRootUri + sEntitySetName + sKeyString + "/to_WorkCenter"
						}
					};
					oEntity.to_WorkCenterType = {
						__deferred: {
							uri: sRootUri + sEntitySetName + sKeyString + "/to_WorkCenterType"
						}
					};
					return oEntity;
				}
				return null;
			},

			getTechObjectDetails: function () {
				return {
					method: "GET",
					path: new RegExp("(C_RSHTechnicalObject)(\\?(.*))?"),
					response: function (oXhr, sUrlParams) {
						var oMockEntry = {
							results: this._oMockdata.C_RSHTechnicalObject.filter(function (oTechObjectDetails) {
								return oTechObjectDetails.TechnicalObjectLabel.replaceAll(" ", "%20") === oXhr.url.match(/TechnicalObjectLabel%20eq%20%27(.*)%27/)[1];
							})
						};
						this.rshRespond(oXhr, {
							data: oMockEntry
						});
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
				this.addRequest(aRequests, this.convertDueToDispatch(), thisArg);
				this.addRequest(aRequests, this.convertDispatchToDue(), thisArg);
				this.addRequest(aRequests, this.changeOperationAssignment(), thisArg);
				this.addRequest(aRequests, this.changeSubOperationAssignment(), thisArg);
				this.addRequest(aRequests, this.getFilteredWorkCenterPersonResp(), thisArg);
				this.addRequest(aRequests, this.triggerChangeScheduling(), thisArg);
				this.addRequest(aRequests, this.createRelationships(), thisArg);
				this.addRequest(aRequests, this.triggerOrdScheduling(), thisArg);
				this.addRequest(aRequests, this.deleteRelationships(), thisArg);
				this.addRequest(aRequests, this.editRelationshipOffset(), thisArg);
				this.addRequest(aRequests, this.dragAndDropAnOrder(), thisArg);
				this.addRequest(aRequests, this.assignNewWorkCenter(), thisArg);
				this.addRequest(aRequests, this.getTechObjectDetails(), thisArg);
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
			}
		};
		return mockRequests;
	},
	true
);
