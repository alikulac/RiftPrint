/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Controller for the My Work Centers fragment(AssignMyWorkCenters.fragment.xml)
 * Hook methods of view life cycle can be imeplemented for fragment life cycle.
 * @author: D056908
 * @name rsh.eam.lib.common.controller.AssignMyWorkCenter
 */
sap.ui.define(
	[
		"sap/rsh/eam/lib/common/controller/BaseDelegate",
		"sap/m/MessageBox",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/ui/model/json/JSONModel"
	],
	function (BaseDelegate, MessageBox, Constants, Util, JSONModel) {
		"use strict";
		return BaseDelegate.extend("sap.rsh.eam.lib.common.controller.AssignMyWorkCenters", {
			_util: Util,
			_sFragmentName: "sap.rsh.eam.lib.common.view.AssignMyWorkCenters",
			_modelsToBeRefreshed: [],
			_oUIElementStates: new JSONModel(),
			_aWorkCenter: [],
			bRefreshAllModels: true,

			/**
			 * Fragment Initialization method
			 *
			 */
			onInit: function () {
				var that = this;
				that._oReuseResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rsh.eam.lib.common");
				that._oTable = that.byId("idMyWorkCenterTable");
				that._oFragment = that.getFragment();
				that._oMessageManager = sap.ui.getCore().getMessageManager();
				that._bFirstCall = true;
				that._oTable.setModel(this._oUIElementStates, "UIElementStates");
				that._setDefaultChangeState();

				// Create a resource bundle for language specific texts
				var oResourceModel = new sap.ui.model.resource.ResourceModel({
					bundleName: "sap.rsh.eam.lib.common.messagebundle"
				});

				this._oCrossAppNav = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");

				// Assign the model object to the SAPUI5 core using the name "i18n"
				that._oFragment.setModel(oResourceModel, "i18nLib");

				//After rendering
				that._oTable.addEventDelegate({
					onAfterRendering: function () {
						if (that._oFragment.getModel().hasPendingChanges(true)) {
							that.byId("idResetButton").setEnabled(true);
						} else {
							that.byId("idResetButton").setEnabled(false);
						}
						that._oFragment.getModel().setDeferredGroups(["iDBatchFilterRequest"]);
						that._oFragment.getModel().setChangeGroups({
							"/C_RSHUserVariantWithTeam": {
								groupId: "iDBatchFilterRequest",
								changeSetId: "iDBatchFilterRequest"
							}
						});
						//Disable the delete icon for work centers used in schedule
						that._oTable.getItems().forEach(function (oColumnListItem) {
							// Control team decided that the deleteControl enable status should not be influenced by application
							// Therefore only set tooltip and keep the delete button enabled
							var oControl = oColumnListItem.getDeleteControl();
							var aCells = oColumnListItem.getCells();
							if (aCells[1].getEditable() === false && aCells[6].getText() === "X") {
								oControl.setTooltip(that._oReuseResourceBundle.getText("UsedInSched"));
							} else {
								oControl.setTooltip(that._oReuseResourceBundle.getText("Delete"));
							}
						});
						if (that._bFirstCall) {
							that._oTable.getModel().attachBatchRequestCompleted(that._handleBatchRequestCompleted, that);
							that.isNavigationEnabled();
						}
					}
				});
			},

			_setDefaultChangeState: function () {
				var oJSONModel = new JSONModel({
					bHasDeletions: false,
					bHasCreations: false,
					bErrorExists: false
				});
				this._oFragment.setModel(oJSONModel, "changeState");
			},

			open: function () {
				return new Promise(
					function (resolve, reject) {
						this._fnResolve = resolve;
						this._fnReject = reject;
						this._oFragment.open();
					}.bind(this)
				);
			},

			/**
			 * Add the new list item to table in My Work Center Popup When user clicks on Plus button
			 * @param {Event} oEvent Event Instance
			 * @Public
			 */
			onAdd: function (oEvent) {
				var that = this;
				//For some reason only one errornous validation will be shown so to overcome this adding a new line with if an error exists will no longer be allowed
				if (that._checkForExistingErrors()) {
					return;
				}

				// create an empty entry which injects into the model
				var oContext = that._oFragment.getModel().createEntry("/C_RSHUserVariantWithTeam", {
					groupId: "iDBatchFilterRequest"
				});
				//Clone the list item and make the SmartField (first Cell) editable
				var oListItemForTable = that.byId("idWorkCenterListItem").clone();
				var aCells = oListItemForTable.getCells();
				aCells[1].setProperty("editable", true);

				//Add an after rendering handler for Smartfield to set the focus to the field in the newly created item
				aCells[1].addEventDelegate({
					onAfterRendering: function () {
						setTimeout(function () {
							aCells[1].focus();
						}, 0);
					}
				});

				oListItemForTable.setBindingContext(oContext);
				that._oTable.addItem(oListItemForTable);
			},

			/**
			 * when user leaves focus of SmartField after Change
			 * Check if the values selected in the workcenter value help are correct
			 * @param {Event} oEvent Event instance.
			 */
			onChangeWorkCenterSmartField: function (oEvent) {
				var that = this;
				var sMessage;
				var oSource = oEvent.getSource();
				if (!this._aWorkCenter.includes(oSource.getBindingContext().getObject().WorkCenter)) {
					this._aWorkCenter.push(oSource.getBindingContext().getObject().WorkCenter);
				}
				//check if the values is selected from the valuelist or not
				if (!oEvent.getParameters().validated) {
					that._oFragment.getModel("changeState").setProperty("/bErrorExists", true);
					//"Please Fill Fields from drop down";
					sMessage = that._oReuseResourceBundle.getText("ValueListStateFields");
					var sTarget = oSource.getBindingContext().sPath + "/WorkCenter";
					that._oMessageManager.addMessages(
						new sap.ui.core.message.Message({
							message: sMessage,
							type: sap.ui.core.MessageType.Error,
							target: sTarget,
							processor: that._oFragment.getModel(),
							persistent: false
						})
					);
				} else {
					// A first time change on the field will have not have WorkCenterInternalID - it is filled only after the change event.
					// Second Time changes can resolve duplicate id issues on other fields.
					var bNotFirstChange = !!oSource.getParent().getBindingContext().getObject().WorkCenterInternalID;
					if (bNotFirstChange) {
						that._deleteDuplicateErrorMessage(oSource);
					}
					// For some Reason the Value State is not set back correctly after choosing from value help - so we do it manual here in general for successfull input validations
					oSource.setValueState(sap.ui.core.ValueState.None);

					that._oFragment.getModel("changeState").setProperty("/bErrorExists", that._hasExistingFieldErrors());
					that._oFragment.getModel("changeState").setProperty("/bHasCreations", true);

					// Setting the value state to none is not working as expected, there removing message from the message model directly
					var oData = this._oMessageManager.getMessageModel().getData();
					if (oData.length > 0) {
						sMessage = oSource.getValueStateText();
						for (var i = 0; i < oData.length; i++) {
							if (oData[i].target.indexOf(oSource.getBindingContext().sPath) !== -1 && oData[i].message === sMessage) {
								this._oMessageManager.removeMessages(oData[i]);
							}
						}
					}
				}
			},

			/**
			 * When user clicks on Delete Row
			 * Remove the item from Table
			 * @param {Event} oEvent Event instance
			 * @public
			 */
			onDeleteRow: function (oEvent) {
				var that = this;
				var oListItem = oEvent.getParameter("listItem");
				var oContext = oListItem.getBindingContext();
				if (!this._aWorkCenter.includes(oContext.getObject().WorkCenter)) {
					this._aWorkCenter.push(oContext.getObject().WorkCenter);
				}
				//WorkCenterInternalID is only filled when it is persisted in backend
				var sKey = that._oFragment.getModel().getKey(oContext.sPath);
				var oWorkCenterField = oListItem.getCells()[1];
				var iIndex = oWorkCenterField.getEditable() ? -1 : sKey.indexOf("WorkCenterInternalID");

				var oUsedInScheduleField = oListItem.getCells()[6];
				if (oWorkCenterField.getEditable() === false && oUsedInScheduleField.getText() === "X") {
					that.byId("idInfoUsedInSchedule").setVisible(true);
				} else {
					that.byId("idInfoUsedInSchedule").setVisible(false);
					oEvent.getSource().removeItem(oListItem).destroy();
					//check if any duplicate work center error gets resolved with this delete
					that._deleteDuplicateErrorMessage(oWorkCenterField);
					if (iIndex !== -1) {
						that._oFragment.getModel().remove(oContext.sPath, {
							groupId: "iDBatchFilterRequest"
						});
						that._oFragment.getModel("changeState").setProperty("/bHasDeletions", true);
						that._oFragment.getModel("changeState").setProperty("/bErrorExists", that._hasExistingFieldErrors());
					} else {
						that._oFragment.getModel().deleteCreatedEntry(oContext);
						// Last error could be removed or the last non empty field could be removed
						that._oFragment.getModel("changeState").setProperty("/bErrorExists", that._hasExistingFieldErrors());
						that._oFragment.getModel("changeState").setProperty("/bHasCreations", that._hasAtLeastOneChange());
					}
				}
			},

			onClose: function () {
				// Play safe and reset all changes before closing
				// items have to be destroyed otherwise it will lead to duplicate key error
				if (this._oFragment.getModel().hasPendingChanges(true)) {
					this._oTable.destroyItems();
					this._oFragment.getModel().resetChanges(null, true);
				}

				if (this._bPartialSave) {
					this._toGraph();
					this._refreshAllModels();
					this._fnResolve();
				}

				this._closeScreen();
			},

			/**
			 * Reload my work centers to old state when user clicks "Restore"
			 * @public
			 */
			onReset: function () {
				var that = this;
				that._oFragment.setBusy(true);

				that.byId("idInfoUsedInSchedule").setVisible(false);

				//All Items need to be destroyed otherwise the reset will give a duplicate key error
				that._oTable.destroyItems();
				that._oFragment.getModel().resetChanges(null, true);
				// Item Binding needs to be refreshed otherwise deleted items will have empty values
				that._oTable.getBinding("items").refresh();
				that._setDefaultChangeState();
			},

			_handleMergeCase: function (sPath) {
				var oModel = this._oFragment.getModel(),
					oWoCVariantWithTeamData = oModel.getData(sPath);
				if (oWoCVariantWithTeamData) {
					var oWoCData = oModel.getData(
						"/C_RSHWorkCenterVH(WorkCenterInternalID='" +
							oWoCVariantWithTeamData.WorkCenterInternalID +
							"',WorkCenterTypeCode='" +
							oWoCVariantWithTeamData.WorkCenterTypeCode +
							"',WorkCenter='" +
							oWoCVariantWithTeamData.WorkCenter +
							"')"
					);

					if (oWoCData) {
						var oListItem = this._oTable.getItems().find(function (oItem) {
							return oItem.getCells()[1].getEditable() && oItem.getBindingContext().getPath() === sPath;
						});

						// Create a new entry
						var oContext = oModel.createEntry("/C_RSHUserVariantWithTeam", {
							properties: {
								Plant: oWoCData.Plant,
								RespyMgmtTeamID: oWoCData.RespyMgmtTeamID,
								TeamDescription: oWoCData.TeamDescription,
								TeamName: oWoCData.TeamName,
								WorkCenter: oWoCData.WorkCenter,
								WorkCenterInternalID: oWoCData.WorkCenterInternalID,
								WorkCenterText: oWoCData.WorkCenterText,
								WorkCenterTypeCode: oWoCData.WorkCenterTypeCode
							},
							groupId: "iDBatchFilterRequest"
						});
						// Update the binding context of the list item
						oListItem.setBindingContext(oContext);
					}
				}
			},

			/**
			 * When user clicks "Assign" , all changes will be submitted to backend
			 * @public
			 */
			onSave: function () {
				var that = this;
				this._bPartialSave = false;
				//User shouldn't be allowed to clickon assign button during save action
				//To avoid setting enabled property directly and use the properties bound to button
				that._oFragment.getModel("changeState").setProperty("/bErrorExists", true);
				that._oFragment.setBusy(true);

				var iRows = that._oTable.getItems().length;

				//Do not proceed in case any Field has already an error
				if (this._checkForDuplicateWorkCenter() || that._checkForExistingErrors()) {
					that._oFragment.setBusy(false);
					return;
				}
				that._deleteEmptyRows();

				//Submit all Changes
				if (that._oFragment.getModel().hasPendingChanges(true)) {
					var aNewMessages = [];
					var bErrorMessage = false;
					var aTargetsHandled = [];
					//	var bSuccessMessage = false;

					that._oFragment.getModel().attachEventOnce("messageChange", function (oEvent) {
						aNewMessages = oEvent.getParameter("newMessages");
						if (aNewMessages.length > 0) {
							bErrorMessage = aNewMessages.some(function (oMessage) {
								return oMessage.type === sap.ui.core.MessageType.Error;
							});
							/*	bSuccessMessage = aNewMessages.some(function (oMessage) {
									return oMessage.type === sap.ui.core.MessageType.Success;
								});*/
						}
					});

					that._oFragment.getModel().submitChanges({
						success: function (oData) {
							if (!bErrorMessage) {
								//submition is done and ruturned only success messages or no messages at all(special case if user delets and adds same work center again)
								that._toGraph(iRows);
								//refresh all models - including fragment model
								that._refreshAllModels();
								that._fnResolve();
								// Duplicate Key issue in CE - test if destroying table items wil solve it
								that._oTable.destroyItems();
								that._closeScreen();
								Util.addMessage(
									that._oReuseResourceBundle.getText("SuccessMessageToast"),
									sap.ui.core.MessageType.Success,
									Constants.sDisplayTypeMessageToast
								);
							} else {
								//sumition returned at least one error message
								//all successfully submitted fields should be set to non editable as long as there is no error message with same target
								var aItems = that._oTable.getItems();

								that._oFragment.getModel("changeState").setProperty("/bErrorExists", false);
								aNewMessages.forEach(function (oMessage) {
									if (oMessage.type === sap.ui.core.MessageType.Success) {
										that._bPartialSave = true;
										var sPath = that._getPathFromTarget(oMessage.target);
										var bErrorWithSameTarget = aNewMessages.some(function (oOtherMessage) {
											return (
												oOtherMessage.type === sap.ui.core.MessageType.Error &&
												that._getPathFromTarget(oMessage.target) === that._getPathFromTarget(oOtherMessage.target)
											);
										});
										if (!bErrorWithSameTarget) {
											aItems.forEach(function (oItem) {
												if (oItem.getBindingContext().getPath() === sPath) {
													oItem.getCells()[1].setEditable(false);
												}
											});
										}
									}
								});

								/*
									Once add WoC change is posted to backend and results in a validation error,
									then later on trying to change WoC in the same item results in merge (update) change in the model.
									To avoid this, create a whole new context and
									update the binding context of the list item in the table. 
									As there can be multiple errors with same target, new context should be created only once per target.
								*/
								aNewMessages.forEach(function (oMessage) {
									var sPath = that._getPathFromTarget(oMessage.target);
									if (oMessage.type === sap.ui.core.MessageType.Error && !aTargetsHandled.includes(sPath)) {
										that._handleMergeCase(sPath);
										aTargetsHandled.push(sPath);
									}
								});
							}
						},
						error: function () {
							that._toGraph(iRows);
							that._oFragment.getModel().resetChanges();
							that._closeScreen();
						}
					});
				} else {
					that._oFragment.setBusy(false);
					return;
				}
			},

			/**
			 * Handle Event of Completed Batch Request of oDataModel to set
			 * Busy Indicator of fragment to false and enable Add Button by First Call
			 * @private
			 */

			_handleBatchRequestCompleted: function () {
				this._oFragment.setBusy(false);
				// To Avoid that user can click add button before data is loaded it is disabled by dialog init and will be enabled here again
				if (this._bFirstCall) {
					this.byId("idAddButton").setEnabled(true);
					this._bFirstCall = false;
				}
			},

			/**
			 * Message Target consists of Binding Path of one Item together with field
			 * To use the Path as identifaction of item, field name has to be removed
			 * @param {String} [sTarget] Message Target of Message added to Message Model
			 * @return {String} Path without fieldname at the end
			 * @Private
			 */
			_getPathFromTarget: function (sTarget) {
				var sPath;
				var iIndex = sTarget.lastIndexOf("/");
				sPath = sTarget.slice(0, iIndex);
				return sPath;
			},

			/**
			 * Delete empty rows from Model and UI
			 * @Private
			 **/
			_deleteEmptyRows: function () {
				var that = this;
				that._oTable.getItems().forEach(function (oColumnListItem) {
					var oContext = oColumnListItem.getBindingContext();
					var oProps = that._oFragment.getModel().getObject(oContext.sPath);
					// WorkCenterInteralID is only available if data has been fetched from Backend
					if (oProps && !oProps.WorkCenterInternalID) {
						that._oFragment.getModel().deleteCreatedEntry(oContext);
						// Also Remove the line from UI
						oColumnListItem.destroy();
					}
				});
			},
			_checkForDuplicateWorkCenter: function () {
				var that = this;
				var sMessage = this._oReuseResourceBundle.getText("DuplicateCheckError");
				var pendingChanges = this._oFragment.getModel().getPendingChanges();
				var path, workCenterID;
				var hasDuplicateWorkCenter = false;
				if (pendingChanges) {
					pendingChanges = Object.entries(pendingChanges);
					pendingChanges.forEach(function (pendingChangeSet) {
						var isDuplicateWorkCenter = false;
						path = "/" + pendingChangeSet[0];
						workCenterID = pendingChangeSet[1].WorkCenterInternalID;
						isDuplicateWorkCenter = that._oTable.getItems().some(function (listItem) {
							var cells = listItem.getCells();
							var comparePath = listItem.getBindingContext().getPath();
							var compareWorkCenterID = cells[8].getText();
							if (path !== comparePath && workCenterID === compareWorkCenterID) {
								return true;
							}
							return false;
						});
						if (isDuplicateWorkCenter) {
							var target = path + "/WorkCenter";
							that._oMessageManager.addMessages(
								new sap.ui.core.message.Message({
									message: sMessage,
									type: sap.ui.core.MessageType.Error,
									target: target,
									processor: that._oFragment.getModel(),
									persistent: false
								})
							);
							hasDuplicateWorkCenter = true;
						}
					});
				}
				return hasDuplicateWorkCenter;
			},
			_deleteDuplicateErrorMessage: function (oCurrentField) {
				var that = this;
				var sMessage = that._oReuseResourceBundle.getText("DuplicateCheckError");
				var sCurrentPath = oCurrentField.getBindingContext().getPath();
				var sCurrentWorkCenterInternalID = oCurrentField.getBindingContext().getObject().WorkCenterInternalID;
				that._oTable.getItems().forEach(function (oColumnListItem) {
					var aCells = oColumnListItem.getCells();
					if (aCells[1].getEditable() === true) {
						var comparePath = oColumnListItem.getBindingContext().getPath();
						var compareWorkCenterID = oColumnListItem.getBindingContext().getObject().WorkCenterInternalID;
						if (sCurrentPath !== comparePath && sCurrentWorkCenterInternalID === compareWorkCenterID) {
							var oData = that._oMessageManager.getMessageModel().getData();
							if (oData.length > 0) {
								for (var i = 0; i < oData.length; i++) {
									if (oData[i].message === sMessage && oData[i].target.indexOf(comparePath) !== -1) {
										that._oMessageManager.removeMessages(oData[i]);
										aCells[1].setValueState(sap.ui.core.ValueState.None);
									}
								}
							}
						}
					}
				});
			},

			/** Publish Event for Setting the Graph
			 * @param {integer} [iRows] Number of rows in popup
			 * @private
			 **/
			_toGraph: function (iRows) {
				var oEventBus = sap.ui.getCore().getEventBus();
				var oWorkCenters = {};
				oWorkCenters.Count = iRows;
				//Publish Event which is being handeled in UtilizationCharts.js to set graph
				oEventBus.publish(Constants.sChannel, Constants.sUpdateChartsAfterChange, oWorkCenters);
			},

			_closeScreen: function () {
				this._oFragment.close();
				this._fnReject();
			},

			/**
			 * Check for any NonEmpty fields in Layout
			 * @returns {boolean} returns wether an nonempty field exists
			 */
			_hasAtLeastOneChange: function () {
				var that = this;
				return that._oTable.getItems().some(function (oColumnListItem) {
					var oContext = oColumnListItem.getBindingContext();
					var oProps = that._oFragment.getModel().getObject(oContext.sPath);
					var bRowIsEmpty = oProps && !oProps.WorkCenterInternalID;
					// check if current row is non empty, only editable rows are getting considered
					if (!bRowIsEmpty && oColumnListItem.getCells()[1].getEditable()) {
						return true;
					}
					return false;
				});
			},

			/**
			 * Check for any Error fields in Layout and opens a pop up to prompt the user to fix them
			 * @returns {boolean} returns wether an error exits as value state
			 */
			_checkForExistingErrors: function () {
				var that = this;
				var bError = that._hasExistingFieldErrors();
				if (bError) {
					MessageBox.error(that._oReuseResourceBundle.getText("ErroStateFields")); //Please Correct the highlighted fields";
				}
				return bError;
			},

			/**
			 * Iterates over the table items and checks for any error fields
			 * @returns {boolean} returns wether am error exists as value state
			 */
			_hasExistingFieldErrors: function () {
				var that = this;
				return that._oTable.getItems().some(function (oColumnListItem) {
					return oColumnListItem.getCells()[1].getValueState() === sap.ui.core.ValueState.Error;
				});
			},

			_refreshAllModels: function () {
				if (this.bRefreshAllModels) {
					this._oFragment.getModel().refresh(true);
					if (this._modelsToBeRefreshed && Array.isArray(this._modelsToBeRefreshed) && this._modelsToBeRefreshed.length > 0) {
						this._modelsToBeRefreshed.forEach(function (model) {
							model.refresh(true);
						});
					}
				}
			},

			/** Allow using apps to register additional models which should be regreshed
			 * after successful change of my workcenters
			 * @param {object} modelsToBeRefreshed array of models to be refreshed sent from source app
			 * @public
			 **/
			registerModelsToBeRefreshed: function (modelsToBeRefreshed) {
				if (modelsToBeRefreshed) {
					this._modelsToBeRefreshed = modelsToBeRefreshed;
				}
			},

			onPressTeamLink: function (oEvent) {
				var sTeamId = oEvent.getSource().getModel().getProperty(oEvent.getSource().getBindingContext().getPath()).RespyMgmtTeamID;
				var sAppSpecificRoute =
					"&/C_RespyMgmtTeamHeaderTP(RespyMgmtTeamID='" + sTeamId + "',DraftUUID=guid'00000000-0000-0000-0000-000000000000',IsActiveEntity=true)/";
				var oArgs = {
					target: {
						semanticObject: "TeamAsResponsible",
						action: "manageTeams"
					},
					params: {
						RespyMgmtTeamCategory: "MAINT_TEAM",
						openMode: "embedIntoDetails"
					},
					appSpecificRoute: sAppSpecificRoute
				};

				var sHash = this._oCrossAppNav.hrefForExternal(oArgs);
				sHash = decodeURIComponent(decodeURIComponent(sHash));
				//This is a workaround for url construct and will be replaced with standard solution soon.
				sHash = sHash.replace("&sap-app-origin-hint=", "");
				sap.m.URLHelper.redirect(sHash, true);
			},

			/** Check whether navigation is allowed or not.
			 * @public
			 **/

			isNavigationEnabled: function () {
				var oUIElementStates = this._oUIElementStates;
				var oDefaultUIState = {
					bTeamsLinkEnabled: false
				};
				var aIntents = [
					{
						target: {
							semanticObject: "TeamAsResponsible",
							action: "manageTeams"
						},
						params: {
							RespyMgmtTeamCategory: "MAINT_TEAM",
							openMode: "embedIntoDetails"
						}
					}
				];
				this._oCrossAppNav.isNavigationSupported(aIntents).done(function (oData) {
					if (oData[0].supported) {
						//If Navigation is supported then activate the Workcenter link
						oDefaultUIState.bTeamsLinkEnabled = true;
						oUIElementStates.setData(oDefaultUIState);
					} else {
						oUIElementStates.setData(oDefaultUIState);
					}
				});
			}
		});
	}
);
