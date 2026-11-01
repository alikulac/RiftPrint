/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
 * Define the Message handler class which can be used across application
 * common services like Displaying the error messages from UI & Model as well.
 * @author: SAP SE
 * @name sap.rsh.eam.lib.common.utils.MessageHandler
 */
sap.ui.define(
	[
		"sap/ui/base/Object",
		"sap/m/MessageBox",
		"sap/ui/core/MessageType",
		"sap/m/MessageToast",
		"sap/rsh/eam/lib/common/utils/Constants",
		"sap/rsh/eam/lib/common/utils/utils",
		"sap/rsh/eam/lib/common/formatters/formatter"
	],
	function (UI5Object, MessageBox, MessageType, MessageToast, Constants, Utils, Formatter) {
		"use strict";

		return UI5Object.extend("sap.rsh.eam.lib.common.controller.MessageHandler", {
			_oMessageManager: null,
			_oMessageManagerModel: null,
			_iLastMsgTimeStamp: 0,
			_oMessagePopoverButtonModel: null,
			_oMessageHandlerResponseModel: null,
			_oSettings: null,
			_oTarget: [],
			_oFullRefreshIndicator: false,

			//If msgs are generated within 1000 ms, it would be considered to be within same user action
			SAME_USER_ACTION_MSGS_DIFF_THRESHOLD: 1000,

			//If messages are created from UI and to be considered with other Backend messages from the same user action
			//Then add this delay to the Difference calculation
			ADDITIONAL_BACKEND_INTERACTION_DELAY: 3000,

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @param {sap.ui.model.json.JSONModel} oMessagePopoverButtonModel JSON Model bound to the MessagePopoverButton
			 * @param {sap.ui.model.json.JSONModel} oMessageHandlerResponseModel JSON Model for Success Message from Batch Response
			 * @param {JSON} oSettings Settings that can be used to customize the MM
			 * @public
			 * @alias sap.rsh.eam.lib.common.utils.MessageHandler
			 */
			constructor: function (oComponent, oMessagePopoverButtonModel, oMessageHandlerResponseModel, oSettings) {
				this._oComponent = oComponent;
				this._oMessagePopoverButtonModel = oMessagePopoverButtonModel;
				this._oMessageHandlerResponseModel = oMessageHandlerResponseModel;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = "";
				this._aKnownMessages = [];
				this._aCurrentListBinding = null;
				this._oTarget = [];
				this._oEventBus = sap.ui.getCore().getEventBus();
				if (this._oComponent.controllers) {
					this._oComponent.controllers.message = this;
				}

				if (this._oModel) {
					this.attachModelErrorHandler(this._oModel);
				}

				if (!this._oMessageManager) {
					this._oMessageManager = sap.ui.getCore().getMessageManager();
					this._oMessageManagerModel = this._oMessageManager.getMessageModel();

					//attach a listener to the MessageManager Model to be notified each time a new message comes in
					this._aCurrentListBinding = this._oMessageManagerModel.bindList("/");
					this._aCurrentListBinding.attachChange(this.onMessageModelChanges, this);
				}

				// If there are any settings passed save it into this instance
				if (oSettings) {
					this._oSettings = oSettings;
				}
			},

			destroy: function () {
				this._oMessageManagerModel.removeBinding(this._aCurrentListBinding);
				this._aCurrentListBinding.destroy();
			},

			/**
			 * Attaches itself as Error Handler for all technical errors of the passed model
			 * @param {oDataModel} oModel - The model for which the error handler has to be attached
			 */
			attachModelErrorHandler: function (oModel) {
				oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._showMetadataError(oParams.response);
				}, this);

				oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();

					// An entity that was not found in the service is also throwing a 404 error in oData.
					// We already cover this case with a notFound target so we skip it here.
					// A request that cannot be sent to the server is a technical error that we have to handle though
					if (
						oParams.response.statusCode !== "404" ||
						(oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)
					) {
						this._showServiceError(oParams.response);
					}
				}, this);
			},

			/**
			 * Event handler for Message Model Change - this is the method to capture all Message Manager activities
			 * @param {Event} oEvent - Not used so far
			 */
			onMessageModelChanges: function (oEvent) {
				//get all existing messages from the Message Manager Model
				var aExistingMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				var iMessagePopoverCount = 0;
				var iHighestSeverityCount = 0;
				var sHighestSeverityType, sHighestSeverityIcon;
				var aPopOverMessages = [];
				//this._oTarget = [];
				this._oFullRefreshIndicator = false;

				var bOldMessagesDeleted = false;

				for (var i = 0; i < aExistingMessages.length; i++) {
					//check if the message has been handled previously
					/*	if (aExistingMessages[i].code === "RSH_CDS_CMN/002" && aExistingMessages[i].message.substring(0, 3) === "~~~") {
						this._oTarget.push(aExistingMessages[i].target);
					}*/
					if (aExistingMessages[i] && !aExistingMessages[i].handled) {
						if (bOldMessagesDeleted === false && this._oMessageHandlerResponseModel.getProperty("/bIsDialogOpen") === false) {
							//removal logic
							//remove the messages that are from backend and came as result of previous action
							if (!this._isMsgWithinSameAction(aExistingMessages[i].date, aExistingMessages[i].waitForBackendCall)) {
								if (this._removehandledMessages(aExistingMessages[i])) {
									return; // Returning here since changing the message model will retrigger onMessageModelChanges anyway
								}
							}
							bOldMessagesDeleted = true;
						}

						this._handleNewMessage(aExistingMessages[i]);
					}
				}

				for (i = 0; i < aExistingMessages.length; i++) {
					//count and collect the popover messages
					if (
						aExistingMessages[i].getPersistent() &&
						aExistingMessages[i].displayType === Constants.sDisplayTypeMessagePopover &&
						aExistingMessages[i].handled
					) {
						iMessagePopoverCount++;
						aPopOverMessages.push(aExistingMessages[i]);
					}
				}
				//Evalute highest severity type, count, icon
				sHighestSeverityIcon = Formatter.messageButtonIconFormatter(aPopOverMessages);
				sHighestSeverityType = Formatter.messageButtonTypeFormatter(aPopOverMessages);
				iHighestSeverityCount = Formatter.countHighestSeverityMessages(sHighestSeverityType, aPopOverMessages);

				this._updateMessagePopover(iMessagePopoverCount, iHighestSeverityCount, sHighestSeverityType, sHighestSeverityIcon);
				if (this._oFullRefreshIndicator) {
					this._oEventBus.publish(Constants.sLibraryChannel, Constants.sServerMessageToUpdateFullEntity, this._oFullRefreshIndicator);
				}
				if (this._oTarget.length) {
					this._oEventBus.publish(Constants.sLibraryChannel, Constants.sServerMessageToUpdateEntity, this._oTarget);
					this._oTarget = [];
				}
			},

			/**
			 * Updates the Message Popover Button Model that is bound to the Message Popover button count display
			 * @param {Integer} iMessagePopoverCount - The count of messages to be displayed in Message Popover
			 * @param {Integer} iHighestSeverityCount - It holds the severity count
			 * @param {String} sHighestSeverityType - Severity type
			 * @param {String} sHighestSeverityIcon - Severity Icon
			 * @private
			 */
			_updateMessagePopover: function (iMessagePopoverCount, iHighestSeverityCount, sHighestSeverityType, sHighestSeverityIcon) {
				if (iMessagePopoverCount > 0) {
					this._oMessagePopoverButtonModel.setData({
						count: iMessagePopoverCount,
						severityCount: iHighestSeverityCount,
						severityType: sHighestSeverityType,
						severityIcon: sHighestSeverityIcon,
						visible: true
					});
				} else {
					this._oMessagePopoverButtonModel.setData({
						count: iMessagePopoverCount,
						severityCount: iHighestSeverityCount,
						severityType: sHighestSeverityType,
						severityIcon: sHighestSeverityIcon,
						visible: false
					});
				}
			},

			_isMessageToBeShownInToast: function (oMessage) {
				return (
					oMessage.type &&
					oMessage.type.toLowerCase() === Constants.sErrorSeveritySuccess &&
					this._oSettings &&
					this._oSettings.bShowSuccessMessageInToast
				);
			},

			_isMessageToBeShownInFooter: function (oMessage) {
				var regExpMessageCode = new RegExp(Constants.sDraftMessageCode);
				return oMessage.type && oMessage.type.toLowerCase() === Constants.sErrorSeveritySuccess && regExpMessageCode.test(oMessage.code);
			},

			/**
			 * Method that uniquely handles each message that is added to the Message Model
			 * @param {Message} oMessage - The message that has changed/added in Message Model
			 * @private
			 */
			_handleNewMessage: function (oMessage) {
				//once this method is called and everything is fine, the message is deemed handled and hence set the flag
				oMessage.handled = true;

				//check for duplicate and handle redundant message
				if (this._removeIfDuplicate(oMessage)) {
					return;
				}

				//Allow special handling of specific error codes
				switch (oMessage.code) {
					case "RSH_ACTIVITY/027":
					case "RSH_ACTIVITY/033":
						this._showMessageBox(oMessage);
						break;
					case "RSH_CDS_CMN/002":
						this._oTarget.push(oMessage.target);
						break;
					case "RSH_CDS_CMN/003":
						this._oFullRefreshIndicator = true;
						break;
					case "/IWBEP/CM_MGW_RT/020": // Resource not found in assetboard (most superior asset)
						//use no display type as the message should not be shown to user.
						//Default handling will cause unexpected behavior for navigation scenarios (back to scheduling board)
						oMessage.displayType = Constants.sDisplayTypeNone;
						break;
					case "RSH_LEVELING/038": // sap-message "Cache initialization in progress" not to be shown in message box
						//It is handled separately in Manage Schedules Base Controller to show Caching Schedule busy dialog
						oMessage.displayType = Constants.sDisplayTypeNone;
						break;
					default:
						//First of all check whether the message has a display type attribute
						// Display type attribute might be already there in case the message was created in UI
						//If it is not there, then the message was created by the backend
						if (!oMessage.displayType) {
							if (this._isMessageToBeShownInFooter(oMessage)) {
								// 'Success' messages to be shown in the Footer
								oMessage.displayType = Constants.sDisplayTypeMessageFooter;
							} else if (this._isMessageToBeShownInToast(oMessage)) {
								// Has the host application requested that 'Success' messages be shown in a toast?
								oMessage.displayType = Constants.sDisplayTypeMessageToast;
							} else {
								// Simply enqueue it so that it is shown in a popover
								if (this._oMessageHandlerResponseModel.getProperty("/bIsDialogOpen")) {
									oMessage.displayType = Constants.sDisplayTypeNone;
								} else {
									// Simply enqueue it so that it is shown in a popover
									if (this._oMessageHandlerResponseModel.getProperty("/bIsDialogOpen")) {
										oMessage.displayType = Constants.sDisplayTypeNone;
									} else {
										oMessage.displayType = Constants.sDisplayTypeMessagePopover;
									}
								}
							}
						} else {
							oMessage.waitForBackendCall = true;
						}

						if (oMessage.displayType === Constants.sDisplayTypeMessageFooter) {
							this._showMessageInFooter(oMessage);
						}

						if (oMessage.displayType === Constants.sDisplayTypeMessageToast) {
							this._showInfoMessage(oMessage);
						}

						if (oMessage.displayType === Constants.sDisplayTypeMessageBox) {
							this._showMessageBox(oMessage);
						}
				}

				oMessage.setPersistent(true);
			},

			/**
			 * Shows a simple message toast for information and success messages an removes the message
			 * @param {sap.ui.message.Message} oMessage - The message that should just be shown as a temporary message overlay
			 * @private
			 */
			_showInfoMessage: function (oMessage) {
				MessageToast.show(oMessage.message);
			},

			/**
			 * The Success Message to be shown in the Footer of the Application to be appended to the Message Model
			 * @param {sap.ui.message.Message} oMessage - The message that should just be shown as a temporary message overlay
			 * @private
			 */
			_showMessageInFooter: function (oMessage) {
				// this._oMessageHandlerResponseModel.setData({
				// 	sSuccessMessage: oMessage.message
				// });
				this._oMessageHandlerResponseModel.setProperty("/sSuccessMessage", oMessage.message);
			},

			/**
			 * Shows a intrusive message box usually for Warning and Error messages for user's immediate attention
			 * @param {sap.ui.message.Message} oMessage - The message that should be shown in a message box
			 * @private
			 */
			_showMessageBox: function (oMessage) {
				switch (oMessage.type) {
					case sap.ui.core.MessageType.Error:
						//show error message box
						MessageBox.error(oMessage.message);
						break;
					case sap.ui.core.MessageType.Information:
						//show info message box
						MessageBox.information(oMessage.message);
						break;
					case sap.ui.core.MessageType.Warning:
						//show warning message box
						MessageBox.warning(oMessage.message);
						break;
					case sap.ui.core.MessageType.Success:
						//show success message box
						MessageBox.success(oMessage.message);
						break;
					default:
						//show alert message box
						MessageBox.alert(oMessage.message);
				}
			},

			/**
			 * Actual technical request failure handler for all models
			 * @param {Event} oError - the technical error param object
			 */
			onRequestFailed: function (oError) {
				if (
					!this.handleSpecificErrorScenarios(oError) &&
					(oError.statusCode !== "404" || (oError.statusCode === 404 && oError.responseText.indexOf("Cannot POST") === 0))
				) {
					this._showServiceError(oError);
				}
			},

			handleSpecificErrorScenarios: function (oError) {
				try {
					var aError = JSON.parse(oError.responseText);
					var sMessageText = aError.error.message.value;
					Utils.addMessage(sMessageText, sap.ui.core.MessageType.Error);
					return true;
				} catch (e) {
					return false;
				}
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
			 * The user can try to refresh the metadata.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showMetadataError: function (sDetails) {
				MessageBox.error(this._sErrorText, {
					id: "metadataErrorMessageBox",
					details: sDetails,
					styleClass: this._getContentDensity(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				});
			},

			_getContentDensity: function () {
				if (this._oComponent.controllers && this._oComponent.controllers.contentDensity) {
					return this._oComponent.controllers.contentDensity.getContentDensityClass();
				} else {
					return this._oComponent.getContentDensityClass();
				}
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError: function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				this._bMessageOpen = true;
				MessageBox.error(this._sErrorText, {
					id: "serviceErrorMessageBox",
					details: sDetails,
					styleClass: this._getContentDensity(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				});
			},

			/**
			 * Compares the last msgId time-stamp with current msgId
			 * @param {Integer} iCurrentMsgTimeStamp Message ID to be compared
			 * @param {Boolean} bWaitForBackendCall whether additional threshold should be added for additional wait for BE messages from same user action
			 * @return {boolean}
			 * Returns true if its within the comparable threshold
			 * Return false if its outside the comparable threshold
			 * @private
			 */
			_isMsgWithinSameAction: function (iCurrentMsgTimeStamp, bWaitForBackendCall) {
				// Try catch block in needed
				if (this._iLastMsgTimeStamp === 0) {
					this._updateLastMsgTimeStamp(iCurrentMsgTimeStamp, bWaitForBackendCall);
					return true;
				}
				if (iCurrentMsgTimeStamp - this._iLastMsgTimeStamp <= this.SAME_USER_ACTION_MSGS_DIFF_THRESHOLD) {
					return true;
				} else {
					this._updateLastMsgTimeStamp(iCurrentMsgTimeStamp, bWaitForBackendCall);
					return false;
				}
			},

			/**
			 * Updates the last Time stamp
			 * If the last message was created from UI, it adds a additional threshold to wait for BE messages
			 * @param {integer} iCurrentMsgTimeStamp The timestamp that should replace the lastMsgTimeStamp
			 * @param {boolean} bWaitForBackendCall whether additional threshold should be added for additional wait for BE messages from same user action
			 * @returns {void}
			 * @private
			 */
			_updateLastMsgTimeStamp: function (iCurrentMsgTimeStamp, bWaitForBackendCall) {
				this._iLastMsgTimeStamp = iCurrentMsgTimeStamp;
				if (bWaitForBackendCall) {
					this._iLastMsgTimeStamp = this._iLastMsgTimeStamp + this.ADDITIONAL_BACKEND_INTERACTION_DELAY;
				}
			},

			/**
			 * Removes old messages except the current message
			 * Checks if the message is handled and that we are not removing the new message
			 * Also don't remove validation issues
			 * @param {Message} oNewMessage - The message that should not be removed from the message model
			 * @returns {void}
			 * @private
			 */
			_removehandledMessages: function (oNewMessage) {
				var _aOldMessages = [];
				var aExistingMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
				for (var i = 0; i < aExistingMessages.length; i++) {
					//do not remove messages raised by client side validation
					if (aExistingMessages[i].handled && aExistingMessages[i].id !== oNewMessage.id && !aExistingMessages[i].validation) {
						aExistingMessages[i].setPersistent(false);
						_aOldMessages.push(aExistingMessages[i]);
					}
				}
				if (_aOldMessages.length > 0) {
					sap.ui.getCore().getMessageManager().removeMessages(_aOldMessages);
					return true;
				} else {
					return false;
				}
			},
			/**
			 * Checks if similar message was previously created and removed it if needed
			 * @param {Object} oNewMessage new message
			 * @returns {Boolean} true if a matching message was found
			 */
			_removeIfDuplicate: function (oNewMessage) {
				if (!this._isMessageToBeShownInToast(oNewMessage)) {
					// Messages in toasts should be always shown

					var aExistingMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
					var _aOldMessages = [];
					for (var i = 0; i < aExistingMessages.length; i++) {
						if (
							aExistingMessages[i].handled &&
							aExistingMessages[i].id !== oNewMessage.id &&
							aExistingMessages[i].message === oNewMessage.message &&
							aExistingMessages[i].target === oNewMessage.target
						) {
							//match found
							_aOldMessages.push(oNewMessage);
							sap.ui.getCore().getMessageManager().removeMessages(_aOldMessages);
							return true;
						}
					}
				}
				return false;
			},
			
			onRestore: function () {
				this._oMessageManagerModel.addBinding(this._aCurrentListBinding);	
				this._aCurrentListBinding.attachChange(this.onMessageModelChanges, this);
			},
			
			onSuspend: function () {
				this._aCurrentListBinding.detachChange(this.onMessageModelChanges, this);
				this._oMessageManagerModel.removeBinding(this._aCurrentListBinding);
			}			
		});
	}
);
