import React, {
    FC,
    useCallback,
    useEffect,
    SyntheticEvent,
    ChangeEvent,
} from "react"
import useModels from "react-use-models"
import useValidator from "react-joi"
import Joi from "joi"
import {
    validateCardNumber,
    formatCardNumber,
    formatCardExpiry,
    parseCardType,
    validateCardExpiry,
    parseCardExpiry,
} from "creditcardutils"

// Styled Elements
import {
    Actions,
    Container,
    Fields,
    ErrorMessage,
    FieldControl,
    FieldLabel,
    Input,
    Form,
    FieldGroups,
    FieldsMerge,
    LeftIconGroup,
    RelativeBlock,
    LeftIconGroupMerge,
    Button,
} from "./index.styled"

import MasterIcon from "@assets/icon/master.png"
import VisaIcon from "@assets/icon/visa.png"
import SecretIcon from "@assets/icon/secret.png"

type TypeCheckoutFormDefaultValues = {
    email: string | null
    card_number: string | null
    card_expire: string | null
    cvv: string | null
}

type TypeParseCardExpiry = {
    month: number
    year: number
}

export type TypeCheckoutFormValues = NonNullable<TypeCheckoutFormDefaultValues>

export interface CheckoutFormProps {
    onSuccess: (values: TypeCheckoutFormValues) => void
    loading?: boolean
    submitText?: string
}

const defaultState: TypeCheckoutFormDefaultValues = {
    email: null,
    card_number: null,
    card_expire: null,
    cvv: null,
}

const CheckoutForm: FC<CheckoutFormProps> = ({
    onSuccess,
    loading = false,
    submitText = "Submit",
}) => {
    const { models, register, updateModel } =
        useModels<TypeCheckoutFormDefaultValues>({
            defaultState,
        })
    const { state, setData } = useValidator({
        initialData: defaultState,
        schema: Joi.object({
            email: Joi.string()
                .email({
                    tlds: { allow: false },
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.email": "Must be a valid email",
                    "any.required": "Required",
                }),
            card_number: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardNumber(value)) {
                            return helpers.error("string.cardNumber")
                        }
                        if (
                            parseCardType(value) !== "mastercard" &&
                            parseCardType(value) !== "visa"
                        ) {
                            return helpers.error("string.wrongCardType")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardNumber": "Must be a valid card",
                    "string.wrongCardType": "Wrong card number",
                    "any.required": "Required",
                }),
            card_expire: Joi.string()
                .required()
                .custom((value, helpers) => {
                    const timeExpiry: TypeParseCardExpiry =
                        parseCardExpiry(value)

                    if (
                        !validateCardExpiry(timeExpiry.month, timeExpiry.year)
                    ) {
                        return helpers.error("string.wrong")
                    }

                    return
                })
                .messages({
                    "string.empty": "Required",
                    "string.wrong": "Wrong date",
                    "any.required": "Required",
                }),
            cvv: Joi.string().length(3).required().messages({
                "string.empty": "Required",
                "string.length": "Need 3 digits",
                "any.required": "Required",
            }),
        }),
    })

    const getErrors = useCallback(
        (field) => {
            return state.$errors[field]
                .map((data: any) => data.$message)
                .join(",")
        },
        [state.$errors]
    )

    const onSubmit = (e: SyntheticEvent) => {
        e.preventDefault()

        onSuccess(state.$data)
    }

    const formatter = {
        cardNumber: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardNumber(e.target.value)

            updateModel("card_number", value)
        },
        cardExpire: (e: ChangeEvent<HTMLInputElement>) => {
            const value = formatCardExpiry(e.target.value)

            updateModel("card_expire", value)
        },
    }

    // Sync model <-> validator
    useEffect(() => {
        setData(models)
    }, [models])

    return (
        <Container>
            <Form onSubmit={onSubmit}>
                <Fields>
                    <FieldControl>
                        <FieldLabel error={!!getErrors("email")}>
                            Email
                        </FieldLabel>

                        <Input
                            {...register.input({ name: "email" })}
                            type="email"
                            placeholder="john@example.com"
                            autoComplete="current-email"
                        />
                    </FieldControl>

                    {getErrors("email") && (
                        <ErrorMessage>{getErrors("email")}</ErrorMessage>
                    )}
                </Fields>

                <FieldGroups>
                    <Fields>
                        <FieldControl>
                            <RelativeBlock>
                                <FieldLabel error={!!getErrors("card_number")}>
                                    Card information
                                </FieldLabel>

                                <Input
                                    {...register.input({
                                        name: "card_number",
                                        onChange: formatter.cardNumber,
                                    })}
                                    type="text"
                                    placeholder="1234 1234 1234 1234"
                                />
                                <LeftIconGroup>
                                    <img
                                        src={VisaIcon}
                                        height="auto"
                                        width={25}
                                    />
                                    <img
                                        src={MasterIcon}
                                        height="auto"
                                        width={25}
                                    />
                                </LeftIconGroup>
                            </RelativeBlock>
                        </FieldControl>

                        {getErrors("card_number") && (
                            <ErrorMessage>
                                {getErrors("card_number")}
                            </ErrorMessage>
                        )}
                    </Fields>

                    <FieldsMerge>
                        <Fields>
                            <Input
                                {...register.input({
                                    name: "card_expire",
                                    onChange: formatter.cardExpire,
                                })}
                                type="text"
                                placeholder="MM / YY"
                            />

                            {getErrors("card_expire") && (
                                <ErrorMessage>
                                    {getErrors("card_expire")}
                                </ErrorMessage>
                            )}
                        </Fields>

                        <Fields>
                            <RelativeBlock>
                                <Input
                                    {...register.input({ name: "cvv" })}
                                    type="text"
                                    placeholder="CVC"
                                />

                                <LeftIconGroupMerge>
                                    <img
                                        src={SecretIcon}
                                        height="auto"
                                        width={25}
                                    />
                                </LeftIconGroupMerge>

                                {getErrors("cvv") && (
                                    <ErrorMessage>
                                        {getErrors("cvv")}
                                    </ErrorMessage>
                                )}
                            </RelativeBlock>
                        </Fields>
                    </FieldsMerge>
                </FieldGroups>

                <Actions>
                    <Button disabled={state.$auto_invalid || loading}>
                        {submitText}
                    </Button>
                </Actions>
            </Form>
        </Container>
    )
}

export default CheckoutForm
