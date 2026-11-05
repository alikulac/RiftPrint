/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/utils", "sap/gantt/misc/Utility", "sap/ui/core/Messaging"],
	function (BaseViewChildController, Utils, GanttUtility, Messaging) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.actions.EditRelationships.controller", {
			onInitMembers: function () {
				this.oGanttChartWithTable = this.byId("idOrderGanttChartWithTable");
				this.oGanttChartContainer = this.byId("idOrderGanttContainer");
			},

			onCreate: function (oEvent) {
				var oParams = this._getCreateParams(oEvent);

				this.oGanttChartContainer.setBusy(true);

				this.oGanttChartWithTable.deselectShapes(this.oGanttChartWithTable.getSelectedShapeUid());

				var oCreateRelationshipCall = this._callCreateRelationship(oParams);

				oCreateRelationshipCall.then(
					function () {
						var oRefreshParams = {
							fetchAllOps: true,
							orderOps: []
						};
						this._extendDeltaRefreshParams(oRefreshParams, oParams, true);

						this.controllers.message.addMessage(this.oBundle.getText("RelationshipCreationSuccess"), "Success", "Toast");

						this.controllers.deltaRefresh.refresh(oRefreshParams);
					}.bind(this),
					function () {
						this.oGanttChartContainer.setBusy(false);
					}.bind(this)
				);
			},

			_getCreateParams: function (oEvent) {
				var sFromNodeUid = GanttUtility.parseUid(oEvent.getParameter("fromShapeUid"));
				var oFromRow = this.oModel.getObject(sFromNodeUid.shapeDataName);

				var sToNodeUid = GanttUtility.parseUid(oEvent.getParameter("toShapeUid"));
				var oToRow = this.oModel.getObject(sToNodeUid.shapeDataName);

				return {
					PredecessorOrder: oFromRow.MaintenanceOrder,
					PredecessorOrderOperation: oFromRow.MaintenanceOrderOperation,
					SuccessorOrder: oToRow.MaintenanceOrder,
					SuccessorOrderOperation: oToRow.MaintenanceOrderOperation,
					type: oEvent.getParameter("type")
				};
			},

			_callCreateRelationship: function (oParams) {
				var sInternalRelationshipType = this._getInternalRelationshipType(oParams.type);

				var oPayload = {
					MaintenanceOrder: oParams.PredecessorOrder,
					MaintenanceOrderOperation: oParams.PredecessorOrderOperation,
					MaintenanceOrderSubOperation: "",
					MaintOrdOperationIsSuccessor: false,
					RelatedMaintenanceOrder: oParams.SuccessorOrder,
					RelatedMaintOrderOperation: oParams.SuccessorOrderOperation,
					OrderOpRelationshipIntType: sInternalRelationshipType
				};

				var sPath =
					"/C_RSHMaintenanceOrdOperationTP(MaintenanceOrder='" +
					Utils.addPadding(oParams.PredecessorOrder, 12) +
					"',MaintenanceOrderOperation='" +
					oParams.PredecessorOrderOperation +
					"',MaintenanceOrderSubOperation='" +
					encodeURIComponent(" ") +
					"')/to_MaintOrderOpRelationship";

				var oCreateParams = {
					path: sPath,
					modelName: "relationshipModel",
					data: oPayload
				};

				return this.controllers.modelPromises.create(oCreateParams);
			},

			_getInternalRelationshipType: function (sRelationshipType) {
				switch (sRelationshipType) {
					case "FinishToStart":
						return "NF";
					case "StartToStart":
						return "AF";
					case "FinishToFinish":
						return "EF";
					case "StartToFinish":
						return "SF";
					default:
						return " ";
				}
			},

			delete: function (oShape) {
				this.oGanttChartContainer.setBusy(true);

				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};
				var aDeleteRelationshipCalls = this._deleteRelationshipForSelectedShapes(oShape, oRefreshParams);

				Promise.allSettled(aDeleteRelationshipCalls).then(
					function (aResults) {
						var bIsDeltaRefreshRequired = this._checkCallsStatus(aResults);
						if (bIsDeltaRefreshRequired) {
							this.controllers.deltaRefresh.refresh(oRefreshParams);
						}
						this.oGanttChartContainer.setBusy(false);
					}.bind(this)
				);
			},

			_deleteRelationshipForSelectedShapes: function (oShape, oRefreshParams) {
				var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();
				var aDeleteRelationshipCalls = [],
					sChangeSetId = "deleteRelationship",
					sPath,
					oRelationshipData;

				if (!oShape.getSelected()) {
					sPath = oShape.getBindingContext().getPath();
					oRelationshipData = oShape.getModel().getData(sPath);
					aDeleteRelationshipCalls.push(this._deleteRelationship(oRelationshipData, oRefreshParams, sChangeSetId));
				} else {
					for (var i = 0; i < aSelectedShapes.length; i++) {
						sPath = GanttUtility.parseUid(aSelectedShapes[i]).shapeDataName;
						//Proceed only for a relationship
						if (sPath.indexOf("C_RSHOperationRelationships") === -1) {
							continue;
						}
						oRelationshipData = oShape.getModel().getData(sPath);
						aDeleteRelationshipCalls.push(this._deleteRelationship(oRelationshipData, oRefreshParams, sChangeSetId + i));
					}
				}

				return aDeleteRelationshipCalls;
			},

			_checkCallsStatus: function (aResults) {
				var bIsDeltaRefreshRequired = false,
					bAtLeastOneFailed = false,
					bAtLeastOneWarning = false;

				aResults.forEach(function (oResult) {
					if (oResult.status === "fulfilled") {
						bIsDeltaRefreshRequired = true;
					} else {
						bAtLeastOneFailed = true;
					}
				});

				var aMessages = Messaging.getMessageModel().getProperty("/");
				aMessages.forEach(function (oMessage) {
					if (oMessage.type === "Warning") {
						bAtLeastOneWarning = true;
					}
				});

				if (!bIsDeltaRefreshRequired) {
					this.controllers.message.addMessage(this.oCommonBundle.getText("AllErrorsMessageToast"), "Error", "Toast");
				} else if (bAtLeastOneFailed) {
					this.controllers.message.addMessage(this.oCommonBundle.getText("AtleastOneErrorMessageToast"), "Error", "Toast");
				} else if (bAtLeastOneWarning) {
					this.controllers.message.addMessage(this.oCommonBundle.getText("SuccessMessageWithWarningToast"), "Warning", "Toast");
				} else {
					this.controllers.message.addMessage(this.oCommonBundle.getText("SuccessMessageToast"), "Success", "Toast");
				}
				return bIsDeltaRefreshRequired;
			},

			_deleteRelationship: function (oRelationshipData, oRefreshParams, sChangeSetId) {
				var oRelationshipDeleteCall = this._callDeleteRelationship(oRelationshipData, sChangeSetId);

				oRelationshipDeleteCall = oRelationshipDeleteCall.then(
					function () {
						this._extendDeltaRefreshParams(oRefreshParams, oRelationshipData, true);
					}.bind(this),
					function () {
						return Promise.reject();
					}
				);

				return oRelationshipDeleteCall;
			},

			_callDeleteRelationship: function (oRelationshipData, sChangeSetId) {
				var sFromOperation = oRelationshipData.PredecessorOrderOperation;
				var sToOperation = oRelationshipData.SuccessorOrderOperation;

				var sRelationshipType = oRelationshipData.NetworkActivityRelationType;
				var sInternalRelationshipType = this._getInternalRelationshipType(sRelationshipType);

				var sPath =
					"/C_RSHMaintenanceOrdOpRelshpTP(MaintenanceOrder='" +
					Utils.addPadding(oRelationshipData.PredecessorOrder, 12) +
					"',MaintenanceOrderOperation='" +
					sFromOperation +
					"',MaintenanceOrderSubOperation='" +
					encodeURIComponent(" ") +
					"',MaintOrdOperationIsSuccessor=" +
					false +
					",RelatedMaintenanceOrder='" +
					Utils.addPadding(oRelationshipData.SuccessorOrder, 12) +
					"',RelatedMaintOrderOperation='" +
					sToOperation +
					"',OrderOpRelationshipIntType='" +
					sInternalRelationshipType +
					"')";

				var oDeleteParams = {
					path: sPath,
					changeSetId: sChangeSetId,
					modelName: "relationshipModel"
				};

				return this.controllers.modelPromises.remove(oDeleteParams);
			},

			deleteOffset: function (oEventData) {
				this.oGanttChartContainer.setBusy(true);

				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};
				var aUpdateOffsetCalls = this._updateOffsetForSelectedShapes(oEventData, true, oRefreshParams);

				Promise.allSettled(aUpdateOffsetCalls).then(
					function (aResults) {
						this.oGanttChartContainer.setBusy(false);
						var bIsDeltaRefreshRequired = this._checkCallsStatus(aResults);
						if (bIsDeltaRefreshRequired) {
							this.controllers.deltaRefresh.refresh(oRefreshParams);
						}
					}.bind(this)
				);
			},

			saveOffset: function (oEventData) {
				this.oGanttChartContainer.setBusy(true);

				var oRefreshParams = {
					fetchAllOps: true,
					orderOps: []
				};
				var aUpdateOffsetCalls = this._updateOffsetForSelectedShapes(oEventData, false, oRefreshParams);

				Promise.allSettled(aUpdateOffsetCalls).then(
					function (aResults) {
						this.oGanttChartContainer.setBusy(false);
						var bIsDeltaRefreshRequired = this._checkCallsStatus(aResults);
						if (bIsDeltaRefreshRequired) {
							this.controllers.deltaRefresh.refresh(oRefreshParams);
						}
					}.bind(this)
				);
			},

			_updateOffsetForSelectedShapes: function (oEventData, bDeleteOffset, oRefreshParams) {
				var aSelectedShapes = this.oGanttChartWithTable.getSelectedShapeUid();

				var oPayload = {
					OpRelshpOffsetDuration: oEventData.OpRelshpOffsetDuration ? oEventData.OpRelshpOffsetDuration : "0.0",
					OpRelshpOffsetDurationUnit: oEventData.OpRelshpOffsetDurationUnit
				};

				var aUpdateRelationshipOffsetCalls = [],
					sChangeSetId = "offsetSubmit",
					sPath,
					oRelationshipData;

				sPath = GanttUtility.parseUid(oEventData.shape.getShapeUid()).shapeDataName;
				var sOffsetDuration = oEventData.shape.getModel().getData(sPath).OpRelshpOffsetDuration;
				for (var i = 0; i < aSelectedShapes.length; i++) {
					sPath = GanttUtility.parseUid(aSelectedShapes[i]).shapeDataName;
					//Proceed only for a relationship
					if (sPath.indexOf("C_RSHOperationRelationships") === -1) {
						continue;
					}
					oRelationshipData = oEventData.shape.getModel().getData(sPath); //data of selected shapes in aSelectedShapes

					var bPerformUpdate = false;
					if (bDeleteOffset) {
						if (oRelationshipData.OpRelshpOffsetDuration !== "0.0") {
							bPerformUpdate = true;
						}
					} else {
						if (
							(sOffsetDuration === "0.0" && oRelationshipData.OpRelshpOffsetDuration === "0.0") ||
							(sOffsetDuration !== "0.0" && oRelationshipData.OpRelshpOffsetDuration !== "0.0")
						) {
							bPerformUpdate = true;
						}
					}

					if (bPerformUpdate) {
						aUpdateRelationshipOffsetCalls.push(this._updateOffset(oRelationshipData, oRefreshParams, oPayload, sChangeSetId + i));
					}
				}

				return aUpdateRelationshipOffsetCalls;
			},

			_updateOffset: function (oRelationshipData, oRefreshParams, oPayload, sChangeSetId) {
				var oUpdateRelationshipOffsetCall = this._callUpdateOffset(oRelationshipData, oPayload, sChangeSetId);

				oUpdateRelationshipOffsetCall = oUpdateRelationshipOffsetCall.then(
					function () {
						this._extendDeltaRefreshParams(oRefreshParams, oRelationshipData, false);
					}.bind(this),
					function () {
						return Promise.reject();
					}
				);

				return oUpdateRelationshipOffsetCall;
			},

			_callUpdateOffset: function (oRelationshipData, oPayload, sChangeSetId) {
				var sRelationshipType = oRelationshipData.NetworkActivityRelationType;
				var sInternalRelationshipType = this._getInternalRelationshipType(sRelationshipType);

				var sPath =
					"/C_RSHMaintenanceOrdOpRelshpTP(MaintenanceOrder='" +
					Utils.addPadding(oRelationshipData.PredecessorOrder, 12) +
					"',MaintenanceOrderOperation='" +
					oRelationshipData.PredecessorOrderOperation +
					"',MaintenanceOrderSubOperation='" +
					encodeURIComponent(" ") +
					"',MaintOrdOperationIsSuccessor=" +
					false +
					",RelatedMaintenanceOrder='" +
					Utils.addPadding(oRelationshipData.SuccessorOrder, 12) +
					"',RelatedMaintOrderOperation='" +
					oRelationshipData.SuccessorOrderOperation +
					"',OrderOpRelationshipIntType='" +
					sInternalRelationshipType +
					"')";

				var oUpdateParams = {
					path: sPath,
					modelName: "relationshipModel",
					changeSetId: sChangeSetId,
					data: oPayload
				};

				return this.controllers.modelPromises.update(oUpdateParams);
			},

			_extendDeltaRefreshParams: function (oParams, oData, bCheckCrossOrders) {
				oParams.orderOps.push({
					order: oData.PredecessorOrder,
					orderOperation: oData.PredecessorOrderOperation,
					checkCrossOrders: bCheckCrossOrders
				});
				oParams.orderOps.push({
					order: oData.SuccessorOrder,
					orderOperation: oData.SuccessorOrderOperation,
					checkCrossOrders: bCheckCrossOrders
				});
			}
		});
	}
);
