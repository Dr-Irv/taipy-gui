/*
 * Copyright 2023 Avaiga Private Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SnackbarProvider } from "notistack";

import Alert from "./Alert";
import { AlertMessage } from "../../context/taipyReducers";

const defaultMessage = "message";
const defaultAlert: AlertMessage = { atype: "success", message: defaultMessage, system: true, duration: 3000 };

class myNotification {
    static requestPermission = jest.fn();
    static permission = "granted";
}

describe("Alert Component", () => {
    beforeAll(() => {
        globalThis.Notification = myNotification as unknown as jest.Mocked<typeof Notification>;
    });
    it("renders", async () => {
        const { getByText } = render(<SnackbarProvider><Alert alert={defaultAlert} /></SnackbarProvider>);
        const elt = getByText(defaultMessage);
        expect(elt.tagName).toBe("DIV");
    });
    it("displays a success alert", async () => {
        const { getByText } = render(<SnackbarProvider><Alert alert={defaultAlert} /></SnackbarProvider>);
        const elt = getByText(defaultMessage);
        expect(elt.closest(".SnackbarItem-variantSuccess")).toBeInTheDocument()
    });
    it("displays an error alert", async () => {
        const { getByText } = render(<SnackbarProvider><Alert alert={{...defaultAlert, atype:"error"}} /></SnackbarProvider>);
        const elt = getByText(defaultMessage);
        expect(elt.closest(".SnackbarItem-variantError")).toBeInTheDocument()
    });
    it("displays a warning alert", async () => {
        const { getByText } = render(<SnackbarProvider><Alert alert={{...defaultAlert, atype:"warning"}} /></SnackbarProvider>);
        const elt = getByText(defaultMessage);
        expect(elt.closest(".SnackbarItem-variantWarning")).toBeInTheDocument()
    });
    it("displays an info alert", async () => {
        const { getByText } = render(<SnackbarProvider><Alert alert={{...defaultAlert, atype:"info"}} /></SnackbarProvider>);
        const elt = getByText(defaultMessage);
        expect(elt.closest(".SnackbarItem-variantInfo")).toBeInTheDocument()
    });
});
