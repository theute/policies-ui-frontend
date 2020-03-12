import * as React from 'react';
import { Button, ButtonVariant, capitalize, Dropdown, DropdownItem, Title } from '@patternfly/react-core';

import { PartialPolicy, WizardStepExtended } from '../PolicyWizardTypes';
import { PolicyFormActions } from '../../../schemas/CreatePolicy/PolicySchema';
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { ActionsForm } from '../ActionsForm';
import { Messages } from '../../../properties/Messages';
import { ActionType } from '../../../types/Policy/Actions';
import { getInsights } from '../../../utils/Insights';
import { Toggle } from '@patternfly/react-core/dist/js/components/Dropdown/Toggle';
import { AngleDownIcon } from '@patternfly/react-icons';

interface AddTriggersDropdownProps {
    addType: (type: ActionType) => void;
    isTypeEnabled: (type: ActionType) => boolean;
}

const AddTriggersDropdown: React.FunctionComponent<AddTriggersDropdownProps> = (props) => {
    const [ isOpen, setOpen ] = React.useState<boolean>(false);

    const typeSelected = type => {
        props.addType(type);
        setOpen(false);
    };

    const items = Object.values(ActionType)
    .filter(async actionType => (await getInsights()).chrome.isBeta() || actionType !== ActionType.WEBHOOK)
    .map(type =>
        <DropdownItem
            key={ type }
            onClick={ () => typeSelected(type) }
            isDisabled={ !props.isTypeEnabled(type) }
        >
            { capitalize(type) }
        </DropdownItem>);

    return (
        <Dropdown
            isOpen={ isOpen }
            dropdownItems={ items }
            isPlain
            toggle={ <Toggle isPlain onToggle={ open => setOpen(open) } id="add-action-toggle">
                <Button component="a" variant={ ButtonVariant.link } isInline> Add trigger actions <AngleDownIcon/> </Button>
            </Toggle> }
        />
    );
};

const ActionsStep = () => {

    const { validateForm, values } = useFormikContext<PartialPolicy>();
    const actionsLength = values.actions?.length;

    // I should not need this. Might be a bug or I'm doing something wrong.
    // Quick debugging turns out that "formik.errors" has an empty action array
    // https://github.com/jaredpalmer/formik/issues/2279
    React.useEffect(() => {
        validateForm();
    }, [ validateForm, actionsLength ]);

    return (
        <>
            <Title headingLevel="h4" size="xl">{ Messages.wizards.policy.actions.title }</Title>
            <FieldArray name="actions">
                { (helpers: FieldArrayRenderProps) => {
                    const isTypeEnabled = (actionType: ActionType) => {
                        const actionsOfType = helpers.form.values.actions?.filter(action => action.type === actionType) || [];
                        return actionsOfType.length === 0;
                    };

                    const addType = (actionType: ActionType) => {
                        helpers.push({ type: actionType });
                    };

                    return (
                        <>
                            <AddTriggersDropdown
                                isTypeEnabled={ isTypeEnabled }
                                addType={ addType }
                            />
                            <ActionsForm id="actions" name="actions" actions={ helpers.form.values.actions } arrayHelpers={ helpers }/>
                        </>
                    );
                } }
            </FieldArray>
        </>
    );
};

export const createActionsStep: (stepOverrides?: Partial<WizardStepExtended>) => WizardStepExtended = (stepOverrides) => ({
    name: Messages.wizards.policy.actions.title,
    component: <ActionsStep/>,
    validationSchema: PolicyFormActions,
    ...stepOverrides
});
