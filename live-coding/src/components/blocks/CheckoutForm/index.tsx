import React, {
    FC,
    useCallback,
    useEffect,
    SyntheticEvent,
    ChangeEvent,
    useState,
} from "react"
import useModels from "react-use-models"
import useValidator from "react-joi"
import Joi from "joi"
import {
    validateCardNumber,
    validateCardExpiry,
    validateCardCVC,
    formatCardNumber,
    formatCardExpiry,
    parseCardType,
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
    PayButton,
    InputGroup,
} from "./index.styled"

// Svg Credit Card Icons
import { ReactComponent as IconVisa } from "@components/svgs/visa.svg"
import { ReactComponent as IconMasterCard } from "@components/svgs/mastercard.svg"

type TypeCheckoutFormDefaultValues = {
    email: string | null
    card_number: string | null
    card_expire: string | null
    cvv: string | null
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

    const [cardType, setCardType] = useState<String>("")

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
                        } else if (
                            parseCardType(value) !== "visa" &&
                            parseCardType(value) !== "mastercard"
                        ) {
                            return helpers.error("string.cardType")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardNumber": "Must be a valid card",
                    "string.cardType": "Must be Visa / Master card type",
                    "any.required": "Required",
                }),
            card_expire: Joi.string()
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardExpiry(parseCardExpiry(value))) {
                            return helpers.error("string.cardExpire")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardExpire": "Must be valid expiration date",
                    "any.required": "Required",
                }),
            cvv: Joi.string()
                .length(3)
                .custom((value, helpers) => {
                    if (value) {
                        if (!validateCardCVC(value)) {
                            return helpers.error("string.cardCVV")
                        }
                    }

                    return value
                })
                .required()
                .messages({
                    "string.empty": "Required",
                    "string.cardCVV": "Must be valid CVV",
                    "string.length": "Maximum 3 digits",
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
            // set card type
            setCardType(parseCardType(value))
            // set card type
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
                            placeholder="you@company.com"
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
                            <FieldLabel error={!!getErrors("card_number")}>
                                Card information
                            </FieldLabel>
                            <InputGroup>
                                <Input
                                    {...register.input({
                                        name: "card_number",
                                        onChange: formatter.cardNumber,
                                    })}
                                    type="text"
                                    placeholder="1234 1234 1234 1234"
                                />
                                {/* display card type */}
                                {cardType === "visa" && <IconVisa />}
                                {cardType === "mastercard" && (
                                    <IconMasterCard />
                                )}
                                {/* display card type */}
                            </InputGroup>
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
                            <Input
                                {...register.input({ name: "cvv" })}
                                type="text"
                                placeholder="123"
                            />

                            {getErrors("cvv") && (
                                <ErrorMessage>{getErrors("cvv")}</ErrorMessage>
                            )}
                        </Fields>
                    </FieldsMerge>
                </FieldGroups>

                <Actions>
                    <PayButton disabled={state.$auto_invalid || loading}>
                        {submitText}
                    </PayButton>
                </Actions>
            </Form>
        </Container>
    )
}

export default CheckoutForm
