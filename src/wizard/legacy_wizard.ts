// @ts-nocheck
const wizardTriggerElement = document.querySelector("[data-action='wizard']");
const wizardModal = document.getElementById("js-wizard-modal");
const wizardCloseButton = document.querySelector(
  "[data-action='wizard-close']"
);

const wizardStepper = document.querySelector("#js-wizard-modal .stepper");
const wizardStepperInstace = new MStepper(wizardStepper, {
  firstActive: 0,
  stepTitleNavigation: false,
  autoFocusInput: true,
  showFeedbackLoader: true,
});

jQuery.validator.addMethod(
  "nospaces",
  (value, element) => {
    return value.indexOf(" ") < 0;
  },
  "Name cannot contain any spaces!"
);

jQuery.validator.addMethod(
  "nounderscores",
  (value, element) => {
    return value.indexOf("_") < 0;
  },
  "Name cannot contain underscores!"
);

jQuery.validator.addMethod(
  "lowercase",
  (value, element) => {
    return value === value.toLowerCase();
  },
  "Name must be all lower case!"
);

export const startLegacyWizard = () => {
  M.Modal.init(wizardModal, {
    dismissible: false,
  }).open();
};
