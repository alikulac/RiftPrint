/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/rsh/eam/lib/common/base/BaseFragment.controller", "sap/m/Label", "sap/ui/core/Popup"], function (BaseFragmentController, Label, Popup) {
	"use strict";

	return BaseFragmentController.extend("sap.rsh.eam.lib.common.people.ConflictsPopup.controller", {
		constructor: function (oComponent, oDependent) {
			var oParams = {
				component: oComponent,
				dependent: oDependent,
				fragmentName: "sap.rsh.eam.lib.common.people.AssignmentContextMenu",
				fragmentId: oComponent.createId("idAssignmentContextMenuFragment")
			};
			BaseFragmentController.call(this, oParams);
		},

		onInitMembers: function () {
			this._fnResolve = undefined;
			this._fnReject = undefined;
		},

		open: function (oShape) {
			return new Promise(
				function (resolve, reject) {
					this._fnResolve = resolve;
					this._fnReject = reject;
					this.getFragment().then(
						function () {
							this._oFragment.openBy(oShape.getDomRef());	
						}.bind(this)
					);
				}.bind(this)
			);
		},

		onAfterClose: function () {
			this._fnReject();
		},

		onDeleteAssignment: function () {
			this._fnResolve();
			this._oFragment.close();
		}
	});
});
