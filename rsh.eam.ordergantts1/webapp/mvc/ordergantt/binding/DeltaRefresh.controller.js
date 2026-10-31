/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/base/BaseViewChild.controller",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (BaseViewChildController, Constants, Utils, Filter, FilterOperator) {
		"use strict";

		/**
		 * The core function to formulate and initiate delta queries/ read requests in order to update the changed orders/ operations.
		 * Invoked upon publish of event "serverMessageToUpdateEntity", in this case the channel is rsh.eam.lib.common.
		 * Also invoked manually after the relationship creation is successful, this case the channel and event are empty.
		 *
		 * There are two read queries one for the order level, other for operation level.
		 * The order and operation(_adjustFiltersForOpQuery) queries are enhanced with filters, such as the orders/ operations changed, the time period, etc.
		 * And with urlParameters, such as $expand: to_Relationships, ( _getUrlParametersForDeltaRefresh), and so on.
		 *
		 * The status change action, say changing to due or dispatch and the other actions, say the mass change, create relationship, these two scenarios need different
		 * handling as latter results in rescheduling, and therefore, the indicator "iShouldFetchAllOp" is used to differentiate between the two.
		 * In case of status change only the particular order/ operation within the time period is requested, in other cases the entire order with all its operations beyond time period is requested.
		 *
		 * Handled scenarios: When there is a reordering of all the operations and they stay within the visible time horizon, the result looks same as full refresh.
		 * Differently handled scenarios: If the operation move out of the visible time horizon, then no shapes are displayed against it,
		 * and no actions can be performed on it(checkIfOperationIsWithinTimePeriod).
		 * Unhandled scenario: Due to rescheduling new operation can also be a part of visible time horizon, here, this operation is not visible unlike full refresh.
		 *
		 * Flow goes to "_onAfterActionsCompleted" directly if no actual change was done, or after all the read queries(Order & Operation) are completed in order to take care
		 * of busy indicators and closing dialogs if any.
		 *
		 * Note:If the utilization indicator setting is on, "Work center change action" needs special handling (findOperationsForUtilizationUpdate)
		 */
		return BaseViewChildController.extend("rsh.eam.ordergantts1.mvc.ordergantt.binding.DeltaRefresh", {
			// before cleanup:
			refresh: function (oTargets, sGroupId, sChangeSetId) {
				return new Promise(
					function (resolve, reject) {
						var bIncludeUtilGantt = this.controllers.utilizationGantt.isLoaded(),
							oFilterSingleOperation,
							aOrderOpFilter = [],
							aOrder = [],
							aOrderFilter = [];

						//Flag to determine if change operation is performed
						var iShouldFetchAllOp = 0;
						var aStoreWorkCentersChanged = [],
							aOrdersScheduled = [];
						for (var property in oTargets) {
							if (oTargets.hasOwnProperty(property)) {
								var oMassChangeObj = oTargets[property]._Values;
								if (iShouldFetchAllOp === 0) {
									iShouldFetchAllOp =
										oMassChangeObj.action === Constants.setDispatchStatusAction ||
										oMassChangeObj.action === Constants.cancelDispatchStatusAction ||
										oMassChangeObj.action === Constants.unassignPeopleAction
											? 0
											: 1;
								}
								if (oMassChangeObj.action === Constants.workcenterAction) {
									var oOrderOpWithWCChange = {
										Order: oMassChangeObj.order,
										Operation: oMassChangeObj.orderOperation
									};
									aStoreWorkCentersChanged.push(oOrderOpWithWCChange);
								}
								//If scheduling action is performed, then store the orders in order to do find if we need to update additional orders
								if (
									oMassChangeObj.action === Constants.schedulingOperationAction ||
									oMassChangeObj.action === Constants.scheduleOrderAction ||
									oMassChangeObj.action === Constants.removeConstraintsAction ||
									oMassChangeObj.action === Constants.createRelationshipAction ||
									oMassChangeObj.action === Constants.deleteRelationshipAction
								) {
									if (aOrdersScheduled.indexOf(oMassChangeObj.order) === -1) {
										aOrdersScheduled.push(oMassChangeObj.order);
									}
								}
								//this._isMoveOrderPerformed = oMassChangeObj.action === Constants.moveOrder ? true : false;

								//Create Filter for particular order and operation
								oFilterSingleOperation = new Filter({
									filters: [
										new Filter("MaintenanceOrder", FilterOperator.EQ, oMassChangeObj.order),
										new Filter("MaintenanceOrderOperation", FilterOperator.EQ, oMassChangeObj.orderOperation)
									],
									and: true
								});
								aOrderOpFilter.push(new Filter(oFilterSingleOperation, false));

								//Create Filter for Order
								if (aOrder.indexOf(oMassChangeObj.order) === -1) {
									aOrder.push(oMassChangeObj.order);
									aOrderFilter.push(new Filter("MaintenanceOrder", FilterOperator.EQ, oMassChangeObj.order));
								}
							}
						}

						if (
							aOrdersScheduled &&
							aOrdersScheduled.length &&
							(this.oUIModel.getProperty("/showImpRel") || this.oUIModel.getProperty("/showExpRel"))
						) {
							var aAffectedOrders = this._findOrdersRelatedByCrossOrder(aOrdersScheduled.slice());
							//Update the filter for order query, if we have related orders in addition to the orders listed for refresh
							if (aAffectedOrders && aAffectedOrders.length && aAffectedOrders.length > aOrdersScheduled.length) {
								aOrderFilter = [];
								aAffectedOrders.forEach(function (order) {
									aOrderFilter.push(new Filter("MaintenanceOrder", FilterOperator.EQ, order));
								});
							}
						}

						var aFiltersForUtilInd = null;
						var aWorkCentersToRefresh = null;
						var bShowUtilization = this.oUIModel.getProperty("/showUtilizationIndicator");
						if (aStoreWorkCentersChanged.length && (bShowUtilization || bIncludeUtilGantt)) {
							var oOrderOpFilterNWCToRefresh = this._findOperationsForUtilizationUpdate(aStoreWorkCentersChanged);
							aFiltersForUtilInd = oOrderOpFilterNWCToRefresh.aOrderOpFilter;
							aWorkCentersToRefresh = oOrderOpFilterNWCToRefresh.aWorkCentersToRefresh;
						}

						//Pass by value Order Filter
						var aOrderFilterCopy = aOrderFilter.slice();
						var _sSelectSubStringOperations = "" + this.controllers.ordergantt.fields.getOperationSelectFields();
						var oReadParams = {
							path: "/C_RSHOrdersAndOperations",
							//Prepare filters for Operation call. For Mass Change we need to fetch all the operations and for other actions just the changed operation.
							filters: this._adjustFiltersForOpQuery(
								bIncludeUtilGantt,
								iShouldFetchAllOp,
								aOrderFilterCopy,
								aFiltersForUtilInd,
								aOrderOpFilter,
								bShowUtilization
							),
							urlParameters: this._getUrlParametersForDeltaRefresh(
								bIncludeUtilGantt,
								this.oUIModel.getProperty("/showImpRel"),
								this.oUIModel.getProperty("/showExpRel"),
								bShowUtilization,
								_sSelectSubStringOperations
							),
							groupId: sGroupId,
							changeSetId: sChangeSetId
						};
						var oOperationReadCall = this.controllers.modelPromises.read(oReadParams);

						//Prepare filters for Order call
						var aFilter = [];
						aFilter.push(new Filter(aOrderFilter, false));
						aFilter.push(
							new Filter({
								filters: [new Filter("OrderOperationRowLevel", FilterOperator.EQ, 0)],
								and: true
							})
						);

						var _sSelectSubStringOrders = "" + this.controllers.ordergantt.fields.getOrderSelectFields();

						var oReadParams = {
							path: "/C_RSHOrdersAndOperations",
							filters: aFilter,
							urlParameters: this._getUrlParametersForDeltaRefresh(
								bIncludeUtilGantt,
								this.oUIModel.getProperty("/showImpRel"),
								this.oUIModel.getProperty("/showExpRel"),
								false /*No need to query Utilization for Order */,
								_sSelectSubStringOrders
							),
							groupId: sGroupId,
							changeSetId: sChangeSetId
						};
						var oOrderReadCall = this.controllers.modelPromises.read(oReadParams);

						Promise.all([oOperationReadCall, oOrderReadCall]).then(
							function (results) {
								resolve(aWorkCentersToRefresh);
							}.bind(this),
							reject
						);
					}.bind(this)
				);
			},

			/**
			 * When we drag and drop an operation,
			 * @private
			 * @param {Array} [aOrdersToRefresh] Collection of scheduled orders
			 * @returns {Array} [aRelatedOrders] Collection of orders to be updated
			 */
			_findOrdersRelatedByCrossOrder: function (aOrdersToRefresh) {
				var oTreeTableBinding = this.byId("idOrderTreeTable").getBinding("rows");
				var oModel = oTreeTableBinding.getModel();
				var aRootNodeContexts = oTreeTableBinding.getRootContexts();
				var aOrderContexts = [];

				//Store root nodes for expanded orders other than listed for refresh
				for (var i = 0; i < aRootNodeContexts.length; i++) {
					if (aOrdersToRefresh.indexOf(this._getDataFromModel(oModel, aRootNodeContexts[i].sPath, "MaintenanceOrder")) !== -1) {
						continue;
					}
					if (oTreeTableBinding.oKeys[aRootNodeContexts[i].sPath.substring(1)]) {
						aOrderContexts.push(aRootNodeContexts[i]);
					}
				}

				//Initial list for orders to refresh
				var aRelatedOrders = aOrdersToRefresh;
				var sRelatedOrder;

				//Update the list if a cross order exists
				for (i = 0; i < aOrderContexts.length; i++) {
					var oKeys = oTreeTableBinding.oKeys[aOrderContexts[i].sPath.substring(1)];
					var sMaintenanceOrder = this._getDataFromModel(oModel, "/" + oKeys[0], "MaintenanceOrder");
					for (var j = 0; j < oKeys.length; j++) {
						if (!this._getDataFromModel(oModel, "/" + oKeys[j], "HasCrossOrderRelationship")) {
							continue;
						}
						var aRelationship = this._getDataFromModel(oModel, "/" + oKeys[j], "to_Relationships");
						if (aRelationship && aRelationship.length) {
							sRelatedOrder = this._findRelatedOrder(oModel, aRelationship, aOrdersToRefresh, sMaintenanceOrder);
						}
						if (sRelatedOrder !== "" && aRelatedOrders.indexOf(sRelatedOrder) === -1) {
							aRelatedOrders.push(sRelatedOrder);
							break;
						}
					}
				}
				return aRelatedOrders;
			},

			/**
			 * Get data for a property via a path in the model
			 * @private
			 * @param {Object} [oModel] The model for the Gantt table
			 * @param {String} [sPath] Path
			 * @param {String} [sProperty] Property to be read
			 * @returns {String} Property value
			 */
			_getDataFromModel: function (oModel, sPath, sProperty) {
				return oModel.getProperty(sPath + "/" + sProperty);
			},

			/**
			 * Helper function to find the orders related by cross order
			 * @private
			 * @param {Object} [oModel] The model for the Gantt table
			 * @param {Array} [aRelationships] Collection of relationships for each operation
			 * @param {Array} [aOrdersToRefresh] Orders to be refreshed originally
			 * @param {String} [sMaintenanceOrder] Maintenance Order for the given operation
			 * @returns {String} [sMaintenanceOrder] Whether this order needs to be read in addition
			 */
			_findRelatedOrder: function (oModel, aRelationships, aOrdersToRefresh, sMaintenanceOrder) {
				for (var i = 0; i < aRelationships.length; i++) {
					var sRelationship = aRelationships[i];
					var sPredecessorOrder = this._getDataFromModel(oModel, "/" + sRelationship, "PredecessorOrder");
					var sSuccessorOrder = this._getDataFromModel(oModel, "/" + sRelationship, "SuccessorOrder");
					if (sMaintenanceOrder !== sPredecessorOrder && aOrdersToRefresh.indexOf(sPredecessorOrder) !== -1) {
						return sMaintenanceOrder;
					} else if (sMaintenanceOrder !== sSuccessorOrder && aOrdersToRefresh.indexOf(sSuccessorOrder) !== -1) {
						return sMaintenanceOrder;
					}
				}
				return "";
			},

			/**
			 * The below function is introduced to handle the special scenario for indirect impact of work center change action.
			 * There are two orders, A and B
			 * ====================================
			 * A    | Operation 1  | Work_Center_1
			 *      | Operation 2  | Work_Center_2
			 * ====================================
			 * B    | Operation 3  | Work_Center_2
			 *      | Operation 4  | Work_Center_1
			 * ====================================
			 * Now expand both orders, perform work center change on Operation 1, change it to Work_Center_2
			 * The delta query reads all the operations for Order A, therefore, utilization for Work_Center_2 is updated
			 * However, the old work center(Work_Center_1)'s utilization is not updated.
			 * Additional affected order/ operation shall be queried representing unique work centers
			 * One update per work center should suffice as each work center utilization share same metadata id.
			 * @private
			 * @param {Array} [aOrderOperationsWithWCChange] Order/ Operations with work center change
			 * @returns {Array} [aOrderOpFilter] Order/ Operation filter representing unique work centers
			 */
			_findOperationsForUtilizationUpdate: function (aOrderOperationsWithWCChange) {
				var oTreeTableBinding = this.byId("idOrderTreeTable").getBinding("rows"),
					//Store the root node(Order) contexts
					aRootNodeContexts = oTreeTableBinding.getRootContexts(),
					//Order Contexts for which the operations are already read
					aExpandedNodesRootContexts = [],
					//Order Contexts for which the action was performed
					aChangedRootNodeContexts = [],
					i,
					j;

				for (i = 0; i < aOrderOperationsWithWCChange.length; i++) {
					for (j = 0; j < aRootNodeContexts.length; j++) {
						var sPath = aRootNodeContexts[j].sPath;

						if (!oTreeTableBinding.oKeys[sPath.substring(1)]) {
							//No need to check unread entries
							continue;
						}
						if (i === 0) {
							aExpandedNodesRootContexts.push(sPath);
						}
						if (sPath.indexOf(aOrderOperationsWithWCChange[i].Order) !== -1) {
							var iPresentInExpandedContexts = aExpandedNodesRootContexts.indexOf(sPath);
							if (iPresentInExpandedContexts !== -1) {
								aExpandedNodesRootContexts.splice(iPresentInExpandedContexts, 1);
							}
							aChangedRootNodeContexts.push(sPath);
						}
					}
				}

				var aUnChangedWorkCenters = [],
					aOldWorkCenter = [],
					oModel = oTreeTableBinding.getModel();
				//A order may have operations with changed work center, store the workcenters in aOldWorkCenter,
				//and operations for which work center is not changed, store these workcenters aUnChangedWorkCenters, ensure unique entries are stored.
				for (i = 0; i < aChangedRootNodeContexts.length; i++) {
					var oExpandedKeys = oTreeTableBinding.oKeys[aChangedRootNodeContexts[i].substring(1)];
					var sMaintenanceOrder = this._getDataFromModel(oModel, aChangedRootNodeContexts[i], "MaintenanceOrder");
					var aChangedOperations = this._getCorrespondingChangedOperations(aOrderOperationsWithWCChange, sMaintenanceOrder);

					for (j = 0; j < oExpandedKeys.length; j++) {
						var sWorkCenter = this._getDataFromModel(oModel, "/" + oExpandedKeys[j], "MainWorkCenter");
						if (aChangedOperations.indexOf(this._getDataFromModel(oModel, "/" + oExpandedKeys[j], "MaintenanceOrderOperation")) !== -1) {
							if (aOldWorkCenter.indexOf(sWorkCenter) === -1) {
								aOldWorkCenter.push(sWorkCenter);
							}
						} else {
							if (aUnChangedWorkCenters.indexOf(sWorkCenter) === -1) {
								aUnChangedWorkCenters.push(sWorkCenter);
							}
						}
					}
				}

				var aWorkCentersToRefresh = [],
					oOrderOpFilterNWCToRefresh = [];
				//Check do we need additional order/ operation query, if the unchanged work centers already contain the old work centers, the order delta read query should be sufficient
				for (i = 0; i < aOldWorkCenter.length; i++) {
					if (aUnChangedWorkCenters.indexOf(aOldWorkCenter[i]) === -1) {
						aWorkCentersToRefresh.push(aOldWorkCenter[i]);
					}
				}

				//The special scenario, create the additonal filter
				if (aWorkCentersToRefresh.length) {
					oOrderOpFilterNWCToRefresh = this._createAdditionalOrderOpFilterForUtilizationUpdate(
						oModel,
						oTreeTableBinding,
						aWorkCentersToRefresh,
						aExpandedNodesRootContexts
					);
				}

				return oOrderOpFilterNWCToRefresh;
			},

			/**
			 * Receives all the orders for which the change is performed, filters the changed operations for the given order
			 * @private
			 * @param {Array} [aChangedOrders] The model for the Gantt table
			 * @param {String} [sGivenOrder] The given order
			 * @returns {Array} [aChangedOperations] Changed operations for the given order
			 */
			_getCorrespondingChangedOperations: function (aChangedOrders, sGivenOrder) {
				var aChangedOperations = [];
				for (var i = 0; i < aChangedOrders.length; i++) {
					if (aChangedOrders[i].Order === sGivenOrder) {
						aChangedOperations.push(aChangedOrders[i].Operation);
					}
				}
				return aChangedOperations;
			},

			/**
			 * Refer JSDoc for _findOperationsForUtilizationUpdate function for speacial scenario example
			 * Check if the already read entries have the previous work centers( Work_Center_1)
			 * Add this order/ operation filter (Order B Operation 4) as additional filters
			 * @private
			 * @param {Object} [oModel] The model for the Gantt table
			 * @param {Object} [oBinding] Binding for the Gantt table
			 * @param {Array} [aWorkCentersToRefresh] Collection of previous work centers that may or may not need update based on read entries
			 * @param {Array} [aExpandedNodesRootContexts] Collection of read entries exclusive to changed entries
			 * @returns {Array} [aOrderOpFilter] Additional filter
			 */
			_createAdditionalOrderOpFilterForUtilizationUpdate: function (oModel, oBinding, aWorkCentersToRefresh, aExpandedNodesRootContexts) {
				var aOrderOpFilter = [],
					oFilterSingleOperation = {};
				for (var i = 0; aWorkCentersToRefresh.length && i < aExpandedNodesRootContexts.length; i++) {
					var oExpandedKeys = oBinding.oKeys[aExpandedNodesRootContexts[i].substring(1)];
					for (var j = 0; aWorkCentersToRefresh.length && j < oExpandedKeys.length; j++) {
						var sOperationWorkCenter = this._getDataFromModel(oModel, "/" + oExpandedKeys[j], "MainWorkCenter");
						var iIndexOfWorkCenter = aWorkCentersToRefresh.indexOf(sOperationWorkCenter);
						if (iIndexOfWorkCenter !== -1) {
							aWorkCentersToRefresh.splice(iIndexOfWorkCenter, 1);
							oFilterSingleOperation = new Filter({
								filters: [
									new Filter("MaintenanceOrder", FilterOperator.EQ, this._getDataFromModel(oModel, "/" + oExpandedKeys[j], "MaintenanceOrder")),
									new Filter(
										"MaintenanceOrderOperation",
										FilterOperator.EQ,
										this._getDataFromModel(oModel, "/" + oExpandedKeys[j], "MaintenanceOrderOperation")
									)
								],
								and: true
							});
							aOrderOpFilter.push(new Filter(oFilterSingleOperation, false));
						}
					}
				}

				var oOrderOpFilterNWCToRefresh = {
					aOrderOpFilter: aOrderOpFilter,
					aWorkCentersToRefresh: aWorkCentersToRefresh
				};
				return oOrderOpFilterNWCToRefresh;
			},

			/**
			 * This will create a combination of filter required for Operation Delta Query, if mass change action is performed, or remove constraints
			 * then entire order is queried,
			 * if there was change work center action, and there are order/ operations indirectly affected, then include this filter as well
			 * Add datetime filter if utilization is to be queried
			 * In other case, for status change actions, query only the changed operation, for ex: dispatch
			 * @private
			 * @param {Integer} [iNotAStatusChange] If the action performed was mass change?
			 * @param {Array} [aOrderFilter] Collection of changed orders filters
			 * @param {Array} [aUtilIndFilter] Collection of minimum order/operation indirectly affected by work center change action filters
			 * @param {Array} [aOrderOpFilter] Collection of changed operations filters
			 * @param {Boolean} [bShowUtilInd] If utilization indicator setting is ON/ OFF
			 * @returns {Array} [aFilter] Adjusted filter
			 */
			_adjustFiltersForOpQuery: function (bIncludeUtilGantt, iNotAStatusChange, aOrderFilter, aUtilIndFilter, aOrderOpFilter, bShowUtilInd) {
				var aFilter = [];
				if (iNotAStatusChange === 1) {
					if (aUtilIndFilter && aUtilIndFilter.length) {
						aFilter.push(new Filter(aOrderFilter, false));
						aFilter[0].aFilters.push(new Filter(aUtilIndFilter, false));
					} else {
						aFilter.push(new Filter(aOrderFilter, false));
					}
					//For mock request to distinguish between Order & Operation
					if (Utils.isMockRun()) {
						aFilter.push(new Filter("OrderOperationRowLevel", FilterOperator.EQ, 1));
					}
				} else {
					aFilter.push(new Filter(aOrderOpFilter, false));
				}
				if (bShowUtilInd || bIncludeUtilGantt) {
					var oTimePeriod = this.controllers.timePeriod.get();
					var oDateTimeFilter = new Filter({
						filters: [
							new Filter("StartDate", FilterOperator.EQ, oTimePeriod.startDate),
							new Filter("EndDate", FilterOperator.EQ, oTimePeriod.endDate)
						],
						and: true
					});
					aFilter[0].aFilters.push(new Filter(oDateTimeFilter, false));
				}
				return aFilter;
			},

			/**
			 * Function to update delta refresh query paramters based on Gantt settings.
			 * @private
			 * @param {Boolean} [bShowImp] Implicit relationship on/ off
			 * @param {Boolean} [bShowExp] Explicit relationship on/ off
			 * @param {Boolean} [bShowUtilInd] Utilization indicator on/ off
			 * @param {String} [sSelectSubString] All the Select fields for orders/ operations
			 * @returns {Object} oUrlParams
			 */
			_getUrlParametersForDeltaRefresh: function (bIncludeUtilGantt, bShowImp, bShowExp, bShowUtilInd, sSelectSubString) {
				var sExpandString = "",
					sSelectString = sSelectSubString;
				var oUrlParams = {};

				if (bShowImp || bShowExp) {
					sExpandString = "to_Relationships";
					sSelectString = sSelectString + "," + "to_Relationships";
				}
				if (bShowUtilInd || bIncludeUtilGantt) {
					sExpandString = sExpandString ? sExpandString + "," + "to_UtilIndicator" : "to_UtilIndicator";
					sSelectString = sSelectString + "," + "to_UtilIndicator";
				}
				if (sExpandString) {
					oUrlParams = {
						$expand: sExpandString,
						$select: sSelectString
					};
				} else {
					oUrlParams = {
						$select: sSelectString
					};
				}
				return oUrlParams;
			}
		});
	}
);
