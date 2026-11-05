/*
 * Copyright (C) 2009-2025 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(
	["sap/rsh/eam/lib/common/base/BaseViewChild.controller", "sap/rsh/eam/lib/common/utils/utils", "sap/rsh/eam/lib/common/utils/Constants"],
	function (BaseViewChildController, Utils, Constants) {
		"use strict";

		return BaseViewChildController.extend("zrsh.eam.ordergantts1.mvc.ordergantt.toolbar.EnableToolbarButtons.controller", {
			onInitMembers: function () {
				this.oTreeTable = this.byId("idOrderTreeTable");
				this.oDispatchButton = this.byId("idButtonDispatch");
				this.oCancelDispatchButton = this.byId("idButtonCancDispatch");
				this.oChangeOperationsButton = this.byId("idButtonChange");
				this.oRemoveConstraintsButton = this.byId("idRemoveConstraints");
				this.oScheduleOrderButton = this.byId("idScheduleOrder");
				this.oAssignMenuButton = this.byId("idAssignMenuButton");
				this.oUnassignPeopleButton = this.byId("idUnassignPeopleButton");
				this.oUnassignPersonResponsibleButton = this.byId("idUnassignPersonResponsibleButton");
				this.oExpandButton = this.byId("idExpandBt");
				this.oCollapseButton = this.byId("idCollapseBt");
			},

			// before cleanup: SchedulingBoard.disableButtons
			disable: function () {
				this.oAssignMenuButton.setEnabled(false);
				this.oDispatchButton.setEnabled(false);
				this.oCancelDispatchButton.setEnabled(false);
				this.oChangeOperationsButton.setEnabled(false);
				this.oScheduleOrderButton.setEnabled(false);
				this.oRemoveConstraintsButton.setEnabled(false);
				this.oExpandButton.setEnabled(false);
				this.oCollapseButton.setEnabled(false);
			},

			// before cleanup: SchedulingBoard.updateToolbarButtonsFromSelectedRows
			update: function () {
				var aSelectedRowIndices = this.controllers.orderGantt.getSelectedIndices();
				var bNoSelection = !aSelectedRowIndices || aSelectedRowIndices.length === 0 || aSelectedRowIndices[0].length === 0;
				if (bNoSelection) {
					this.disable();
					return;
				}

				var bAtLeastOneItemHasConstraints = false;
				var bAtLeastOneHeaderRowSelected = false;
				var bAtLeastOneItemDispatched = false;
				var bAtLeastOneOperationChangeable = false;
				var bAtLeastOneItemDue = false;
				var bAtLeastOneOperationAssigned = false;
				var bAtLeastOneOperationAssignedPersonResponsible = false;
				var bAtLeastOneExpanded = false;
				var bAtLeastOneCollapsed = false;

				var aSelectedItemsContext = this.controllers.orderGantt.getSelectedBindingContexts();
				for (var i = 0; i < aSelectedItemsContext.length; i++) {
					var oOperation = aSelectedItemsContext[i].getObject();
					if (oOperation.OrderOperationRowLevel === 0) {
						bAtLeastOneHeaderRowSelected = true;
						var bExpanded = this.oTreeTable.isExpanded(aSelectedRowIndices[i]);
						if (bExpanded) {
							bAtLeastOneExpanded = true;
						} else {
							bAtLeastOneCollapsed = true;
						}
					} else if (Utils.checkIfOperationIsWithinTimePeriod(oOperation, this.controllers.timePeriod.get())) {
						continue;
					} else {
						if (oOperation.HasError) {
							// "it is a very weird to call this function as part of a button enablement
							// but I did not dare to clean this up" (the refactoring developer)
							this.controllers.ordergantt.dispatchOperations.validateOperationInProcess(oOperation);
						} else {
							bAtLeastOneOperationChangeable = true;
							switch (oOperation.ProcessingStatus) {
								case Constants.dispatchedStatusCode:
									bAtLeastOneItemDispatched = true;
									break;
								case Constants.dueStatusCode:
									bAtLeastOneItemDue = true;
									break;
							}
							if (oOperation.OpBscStartDateConstraintType && oOperation.OrderOperationStartDateTime) {
								bAtLeastOneItemHasConstraints = true;
							}
							if (oOperation.NumberOfAssignedPersons !== "0" && oOperation.NumberOfAssignedPersons !== " 0") {
								bAtLeastOneOperationAssigned = true;
							}
							if (oOperation.OperationPersonResponsible !== Constants.idUnassignedPersonResponsible && oOperation.OperationPersonResponsible) {
								bAtLeastOneOperationAssignedPersonResponsible = true;
							}
						}
					}
				}
				this.oCollapseButton.setEnabled(bAtLeastOneExpanded);
				this.oExpandButton.setEnabled(bAtLeastOneCollapsed);
				this.oChangeOperationsButton.setEnabled(bAtLeastOneOperationChangeable);
				this.oCancelDispatchButton.setEnabled(bAtLeastOneItemDispatched);
				this.oDispatchButton.setEnabled(bAtLeastOneItemDue);
				this.oRemoveConstraintsButton.setEnabled(bAtLeastOneItemHasConstraints);
				this.oScheduleOrderButton.setEnabled(bAtLeastOneHeaderRowSelected);
				this.oAssignMenuButton.setEnabled(bAtLeastOneOperationChangeable);
				this.oUnassignPeopleButton.setEnabled(bAtLeastOneOperationAssigned);
				this.oUnassignPersonResponsibleButton.setEnabled(bAtLeastOneOperationAssignedPersonResponsible);
			}
		});
	}
);
