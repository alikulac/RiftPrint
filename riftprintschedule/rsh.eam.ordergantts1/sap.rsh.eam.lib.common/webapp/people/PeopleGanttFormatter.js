/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	var oFormatter = {
		_getOperationsWithSplits: function (sPersonID) {
			var sPath = "/C_RSHPersonTP('" + sPersonID + "')/to_Assignment";
			var aAssignments = this._oPeopleModel.getObject(sPath);
			var oSplits = this._getSplitsForSelectedOperations(aAssignments);
			var iOperationsWithSplits = Object.keys(oSplits).length;

			return iOperationsWithSplits;
		},

		getAssignButtonIcon: function (sPersonID) {
			if (sPersonID) {
				var iOperationsWithSplits = oFormatter._getOperationsWithSplits.call(this, sPersonID);
				return iOperationsWithSplits === this._aOrderOperation.length ? "sap-icon://delete" : "sap-icon://accept";
			} else {
				return null;
			}
		},

		getExpandIcon: function (sPersonID) {
			if (sPersonID) {
				var bExpanded = Object.keys(this._oExpandedRows).includes(sPersonID);
				return bExpanded ? "sap-icon://navigation-down-arrow" : "sap-icon://navigation-right-arrow";
			} else {
				return null;
			}
		},

		getAssignButtonText: function (sPersonID) {
			if (sPersonID) {
				var iOperationsWithSplits = oFormatter._getOperationsWithSplits.call(this, sPersonID);
				return iOperationsWithSplits === this._aOrderOperation.length
					? this.oCommonBundle.getText("UnassignButtonText")
					: this.oCommonBundle.getText("AssignButtonText");
			} else {
				return null;
			}
		},

		getAssignButtonType: function (sPersonID) {
			if (sPersonID) {
				var iOperationsWithSplits = oFormatter._getOperationsWithSplits.call(this, sPersonID);
				return iOperationsWithSplits === this._aOrderOperation.length ? "Reject" : "Accept";
			} else {
				return null;
			}
		},

		getUnassignVisiblitiy: function (sPersonID) {
			if (sPersonID) {
				var iOperationsWithSplits = oFormatter._getOperationsWithSplits.call(this, sPersonID);
				return iOperationsWithSplits > 0 && iOperationsWithSplits < this._aOrderOperation.length ? true : false;
			} else {
				return null;
			}
		},

		getAssignmentFillColor: function (sCapacityRequirement, sOrderId, sOperationId, sSubOperationId) {
			if (sOrderId) {
				var sAsgnmtOrderOperation = sOrderId + "/" + sOperationId + "/" + sSubOperationId;
				var bSelectedOperation = this._aOrderOperation.includes(sAsgnmtOrderOperation);
				return sCapacityRequirement !== undefined && !bSelectedOperation ? "@sapNeutralColor" : "@sapInformativeColor";
			} else {
				return null;
			}
		},

		getAssignmentStrokeColor: function (sCapacityRequirement, sOrderId, sOperationId, sSubOperationId) {
			if (sOrderId) {
				var sAsgnmtOrderOperation = sOrderId + "/" + sOperationId + "/" + sSubOperationId;
				var bSelectedOperation = this._aOrderOperation.includes(sAsgnmtOrderOperation);
				return sCapacityRequirement !== undefined && !bSelectedOperation ? "@sapUiBaseBG" : "@sapInformativeColor";
			} else {
				return null;
			}
		},

		getAssignmentLabel: function (sOrderId, sOperationId, sSubOperationId) {
			if (sOrderId) {
				var sLabel = "";
				if (sSubOperationId) {
					sLabel = this.oCommonBundle.getText("AssignmentLabelForSubOp", [sOrderId, sOperationId, sSubOperationId]);
				} else {
					sLabel = this.oCommonBundle.getText("AssignmentLabelForOp", [sOrderId, sOperationId]);
				}
				return sLabel;
			} else {
				return "";
			}
		},

		getAssignmentTooltip: function (sCapacityRequirement, sOrderId, sOperationId, sSubOperationId) {
			if (sOrderId) {
				var sAsgnmtOrderOperation = sOrderId + "/" + sOperationId + "/" + sSubOperationId;
				var bSelectedOperation = this._aOrderOperation.includes(sAsgnmtOrderOperation);
				var bSavedSplit = sCapacityRequirement !== undefined;
				var bIsASubOperation = !!sSubOperationId;
				var sTextKey;
				if (bSelectedOperation && bSavedSplit) {
					sTextKey = bIsASubOperation ? "savedAssgnForSubopTooltip" : "savedAssgnForOpTooltip";
				} else if (bSelectedOperation && !bSavedSplit) {
					sTextKey = bIsASubOperation ? "draftAssgnForSubopTooltip" : "draftAssgnForOpTooltip";
				} else {
					sTextKey = bIsASubOperation ? "otherAssgnForSubopTooltip" : "otherAssgnForOpTooltip";
				}
				return this.oCommonBundle.getText(sTextKey, [sOrderId, sOperationId, sSubOperationId]);
			} else {
				return null;
			}
		}
	};

	return oFormatter;
});
