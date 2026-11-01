/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/rsh/eam/lib/common/utils/ItemHashMap",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils"
	],
	function (BaseViewChildController, Filter, FilterOperator, ItemHashMap, Constants, Utils) {
		"use strict";

		return BaseViewChildController.extend("sap.rsh.eam.lib.common.people.UnassignPeople.controller", {
			constructor: function (oParent, sModelName) {
				this._sDataModelName = sModelName;
				BaseViewChildController.call(this, oParent);
			},

			onInit: function () {
				BaseViewChildController.prototype.onInit.apply(this, arguments);
				this._oPeopleModel.setDeferredGroups(this._oPeopleModel.getDeferredGroups().concat(["idBatchUnassignAll"]));
			},

			onInitMembers: function () {
				this._oPeopleModel = this.oComponent.getModel("peopleGanttModel");
				this._oDataModel = this.oComponent.getModel(this._sDataModelName);
			},

			_getOperationFilters: function(aOpShapePaths) {
				var aOrderOpFilters = [];
				aOpShapePaths.forEach(
					function (oShapePath) {
						var oData = this._oDataModel.getProperty(oShapePath);
						var oOrderFilter = new Filter({
							path: "MaintenanceOrder",
							operator: FilterOperator.EQ,
							value1: oData.MaintenanceOrder
						});
						var oOperationFilter = new Filter({
							path: "MaintenanceOrderOperation",
							operator: FilterOperator.EQ,
							value1: oData.MaintenanceOrderOperation
						});
						var oSubOperationFilter = new Filter({
							path: "MaintenanceOrderSubOperation",
							operator: FilterOperator.EQ,
							value1: oData.MaintenanceOrderSubOperation
						});

						var oFilter = new Filter({
							filters: [oOrderFilter, oOperationFilter, oSubOperationFilter],
							and: true
						});
						aOrderOpFilters.push(oFilter);
					}.bind(this)
				);

				var oOperationFilter = new Filter({
					filters: aOrderOpFilters,
					and: false
				});

				return [oOperationFilter];
			},

			_getTargetParametersForDeltaRefresh: function(aOpShapePaths) {
				var oTargetParams = new ItemHashMap();
				oTargetParams.parameters = {};
				oTargetParams.parameters.bRefreshOfSourceAppRequired = true;

				aOpShapePaths.forEach(
					function (oShapePath) {
						var oData = this._oDataModel.getProperty(oShapePath);

						var oValues = {
							order: oData.MaintenanceOrder,
							orderOperation: oData.MaintenanceOrderOperation,
							orderSubOperation: oData.MaorderSubOperation,
							action: Constants.unassignPeopleAction
						};
						// Creating a unique key for oTargetParams so that corresponding operation filters for all the
						// selected operations are created
						var sKey = oData.MaintenanceOrder + "/" + oData.MaintenanceOrderOperation + "/" + oData.MaintenanceOrderSubOperation;
						oTargetParams.put([sKey, "", Constants.unassignPeopleAction], oValues, "");
					}.bind(this)
				);
				
				return oTargetParams;
			},

			unassignSplits: function (aOpShapePaths) {
				var aOperationFilters = this._getOperationFilters(aOpShapePaths);
				var oTargetParams = this._getTargetParametersForDeltaRefresh(aOpShapePaths);

				var oReadParams = {
					modelName: "peopleGanttModel",
					path: "/C_RSHPersonAssignmentTP",
					filters: aOperationFilters
				};
				var oReadAndDeleteAssignmentsPromise = new Promise(function(resolve, reject){
					this.controllers.modelPromises.read(oReadParams).then(
						function (aSplitData) {
							var bSplitExists = aSplitData.results.length > 0;
							// There is a case where the GET call for assignments may not return assignments (count(assignments) = 0)
							// This happens in a two user scenario where one user deletes all the assignment before the second user can
							// execute the 'Unassign people' action.
							if (bSplitExists) {
								this._callDeleteSplits(aSplitData).then(
									function (oData) {
										var oResponse = oData.__batchResponses[0];
										var bRequestSucceeded = oResponse.hasOwnProperty("__changeResponses");
										this._displayToastMessage(bRequestSucceeded);
										resolve(oTargetParams);
									}.bind(this),
									function () {
										this._displayToastMessage(false);
									}
								);
							} else {
								this._displayToastMessage(true);
								resolve(oTargetParams);
							}
						}.bind(this)
					);
				}.bind(this));
				
				return oReadAndDeleteAssignmentsPromise;
			},

			_callDeleteSplits: function (aSplitData) {
				aSplitData.results.forEach(
					function (oSplit) {
						var sCapacityRequirement = oSplit.CapacityRequirement;
						var sCapacityRequirementItem = oSplit.CapacityRequirementItem;
						var sCapacityRqmtItemCapacity = oSplit.CapacityRqmtItemCapacity;
						var sQuery =
							"/C_RSHPersonAssignmentTP(CapacityRequirement='" +
							sCapacityRequirement +
							"',CapacityRequirementItem='" +
							sCapacityRequirementItem +
							"',CapacityRqmtItemCapacity='" +
							sCapacityRqmtItemCapacity +
							"')";

						var oRemoveParams = {
							modelName: "peopleGanttModel",
							path: sQuery,
							groupId: "idBatchUnassignAll",
							refreshAfterChange: false
						};
						this.controllers.modelPromises.remove(oRemoveParams);
					}.bind(this)
				);

				var oSubmitChangesParams = {
					modelName: "peopleGanttModel",
					groupId: "idBatchUnassignAll"
				};
				return this.controllers.modelPromises.submitChanges(oSubmitChangesParams);
			},

			_displayToastMessage: function (bRequestSucceeded) {
				if (!bRequestSucceeded) {
					Utils.addMessage(this.oCommonBundle.getText("AllErrorsMessageToast"), sap.ui.core.MessageType.Error, Constants.sDisplayTypeMessageToast);
				} else {
					Utils.addMessage(this.oCommonBundle.getText("SuccessMessageToast"), sap.ui.core.MessageType.Success, Constants.sDisplayTypeMessageToast);
				}
			}
		});
	}
);
