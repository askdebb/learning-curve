# Learning Curve: Enterprise Authentication Architecture & Security Hardening

> **Domain:** Application Security & Frontend Architecture  
> **Reference Projects:** `business-bitnormous-merchant`, `bitnormous-web`  
> **Technologies:** React, TypeScript, TanStack Query v5, Yup, Tailwind CSS v4, Google Identity Services  
> **Type:** Architectural Pattern & Hardening Standard  

---

## 1. What Was at Stake

When building authentication for a merchant-facing financial application handling transactions, security, performance, and cross-project consistency are non-negotiable.

### The Problem Space
Prior to refactoring, the auth implementation had several critical architectural liabilities:

1. **Severe Keystroke Re-Render Overhead**:  
   Inputs were fully controlled (`value={channelValue}` and `onChange={setChannelValue}`). Every keystroke forced a re-render of the entire `LoginForm` tree, re-instantiating callbacks, re-running logic, and recalculating child props. On lower-end devices, this introduced palpable input latency.
2. **Account Enumeration Security Vulnerability**:  
   When authentication failed, the UI displayed explicit field-level error messages (e.g., turning the password border red and printing `"Your password is incorrect"` underneath). This is a textbook **OWASP Account Enumeration vulnerability**—an attacker could submit random emails and verify which accounts exist because only existing accounts return "incorrect password".
3. **Monolithic Component Anti-Pattern**:  
   The presentation component (`LoginForm.tsx`) was overloaded with:
   - Direct TanStack mutation calls
   - Direct store manipulation
   - Inline channel type detection (`channelValue.includes("@")`)
   - Google OAuth popup lifecycle handling
   - Error string parsing
4. **Browser Autofill Visual Leakage**:  
   Web browsers (Chrome, Edge, Safari) inject `:-webkit-autofill` styles (`rgb(232, 240, 254)` light blue background). When the user autofilled an email, it appeared tinted blue with black text, while the password was white with gray text. Users perceived this as the system pre-validating the email as correct.
5. **Architectural Divergence Across Codebases**:  
   The consumer web application utilized a declarative Yup schema validation structure (`src/requests/SigninRequestRules.ts`), whereas the merchant application lacked schema validation and had diverged.

---

## 2. Architectural Options Evaluated

### Option A: Form State Management

| Strategy | How It Works | Pros | Cons | Decision |
|---|---|---|---|---|
| **Fully Controlled** (`useState` per input) | State updates on every `onChange` event. | Easy to read values in state; trivial to do live masking. | Re-renders the component on **every single keystroke**. Unnecessary when live keystroke validation isn't required. | **Rejected** |
| **Formik / React Hook Form** | Form library manages controlled inputs with subscriptions. | Standardized form handling. | Adds external dependency overhead for a simple two-input login form. | **Rejected** |
| **Uncontrolled (`useRef` / DOM)** | Native DOM holds the value; values are read once upon `onSubmit`. | **Zero re-renders on keystrokes**. Maximum input responsiveness. Simplest architecture. | Cannot trigger real-time character-by-character UI transformations (not needed for login). | **CHOSEN** |

### Option B: Validation Strategy

| Strategy | How It Works | Pros | Cons | Decision |
|---|---|---|---|---|
| **Inline Custom Regex** | Hardcoded regex checks inside the component or hook. | No dependencies. | Hard to maintain, difficult to unit-test in isolation, diverges across repositories. | **Rejected** |
| **Pure TypeScript Subprocesses** | Standalone regex functions in `subprocesses/validateAuthInput.ts`. | Clean, testable, 0 KB bundle footprint. | Duplicates validation rules already maintained in related projects. | **Transitional** |
| **Yup Request Schemas** | Declarative schema objects in `src/requests/` matching the main web app. | Combines casting (normalization) with validation; 100% schema parity across web & merchant; highly extensible. | Adds small dependency (`yup`). | **CHOSEN** |

### Option C: Hook Architecture

| Strategy | How It Works | Pros | Cons | Decision |
|---|---|---|---|---|
| **Direct Mutation Call in Component** | Component imports `useSignInAction` directly. | Fewer files. | Violates Separation of Concerns; puts network orchestration into presentation. | **Rejected** |
| **Monolithic `useAuth` Hook** | One massive hook doing normalization, validation, mutation, OAuth, and UI state. | Single import. | Violates Single Responsibility Principle; difficult to test individual steps. | **Rejected** |
| **Orchestrator Hook + Subprocess Pipeline** | `useAuth` acts as a coordinator; delegates to pure subprocess functions; calls TanStack mutation. | Clean boundaries, high testability, easy maintenance, zero UI coupling. | Requires clear folder structure. | **CHOSEN** |

### Option D: Security & Error Presentation

| Strategy | How It Works | Pros | Cons | Decision |
|---|---|---|---|---|
| **Field-Level Specific Errors** | Highlights password input red; prints "Your password is incorrect". | Helpful for user if password was mistyped. | **Severe OWASP security flaw** (confirms email existence; enables brute-force account enumeration). | **Rejected** |
| **Global Generic Error Alert** | Highlights neither field red; renders top banner: *"The email or password you entered is incorrect"*. | **OWASP compliant**; prevents enumeration; clean, professional visual hierarchy. | User must check both email and password if mistyped. | **CHOSEN** |

### Option E: Browser Autofill Styling

| Strategy | How It Works | Pros | Cons | Decision |
|---|---|---|---|---|
| **Global CSS Overrides in `index.css`** | Targets `input:-webkit-autofill` via global stylesheet rules. | Works globally. | Pollutes global CSS with vendor overrides; breaks component encapsulation. | **Rejected** |
| **Tailwind Variant Utilities in `Input.tsx`** | Uses Tailwind's `autofill:` modifier with inset shadow and arbitrary text fill color. | Fully encapsulated in component; zero global stylesheet pollution; clean. | Requires knowledge of Tailwind arbitrary variants. | **CHOSEN** |

---

## 3. The Chosen Architecture & Core Rationale

### High-Level Data Flow

```text
                           LoginForm.tsx  (Uncontrolled: useRef)
                                 │
                     User types  │ (0 React re-renders)
                                 │
                     User submit ▼ onSubmit(identifier, password)
                             useAuth()  (UI Coordinator Hook)
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │     subprocesses/     │
                     │                       │
                     │  1. normalizeAuthInput│ ── Uses Yup cast (trim/lowercase)
                     │  2. validateAuthInput │ ── Uses Yup validateSync
                     │  3. prepareCredentials│ ── Packages UserCredentialsInterface
                     └───────────┬───────────┘
                                 │
                 Validation OK?  │
                 ├── No ─────────┴──► Set generic globalError (0 network requests)
                 │
                 ▼ Yes
          useSignInAction()  (TanStack Query Mutation)
                 │
                 ▼
          AuthController.signIn()
                 │
                 ▼
          Controller / HttpRequest (Axios Interceptors)
                 │
                 ▼
          POST /auth/signin  (Backend API)
```

### Why This Architecture Was Selected

1. **True Separation of Concerns**:
   - **`LoginForm.tsx`**: Dumb presentation layer. Collects values via refs, renders loading spinners, displays the global alert.
   - **`useAuth()`**: UI coordinator. Holds zero form values in state; handles async flow, error states, and social login triggers.
   - **`subprocesses/`**: Pure TypeScript functions. Can be tested in Jest/Vitest without React, TanStack, or DOM mocks.
   - **`requests/`**: Yup schema source of truth matching `bitnormous-web`.
   - **`useSignInAction()`**: TanStack mutation managing cache, cookies, session storage, and redirect side-effects.
   - **`AuthController.ts`**: HTTP client communication.
2. **Zero Keystroke Performance Penalty**: By using `useRef`, typing 100 characters causes **0 re-renders**. In a controlled form, it causes 100 re-renders.
3. **OWASP Compliance**: Protects merchants from targeted credential stuffing and user enumeration by presenting generic error states.

---

## 4. Step-by-Step Implementation & Code Snippets

### Step 1: Request Validation Schemas (Yup)

Created in `src/requests/SigninRequestRules.ts`:

```typescript
// src/requests/SigninRequestRules.ts
import { object, string } from "yup";

export const SigninWithPhoneRules = object({
  phone: string()
    .trim()
    .required("Phone number is required")
    .test("valid-phone", "Invalid phone number", (value) => {
      if (!value) return false;
      const phoneDigits = value.replace(/\D/g, "");
      return phoneDigits.length >= 9 && phoneDigits.length <= 15;
    })
    .label("Phone"),
  password: string().trim().required("Password is required").min(6).label("Password"),
});

export const SigninWithEmailRules = object({
  email: string()
    .trim()
    .lowercase()
    .required("Email is required")
    .email("Invalid email address")
    .label("Email"),
  password: string().trim().required("Password is required").min(6).label("Password"),
});
```

Exported via barrel file `src/requests/index.ts`:

```typescript
// src/requests/index.ts
export * from "./SigninRequestRules";
```

---

### Step 2: Subprocess Processing Pipeline

Located in `src/actions/auth/subprocesses/`:

#### 2.1 Normalization Subprocess
Utilizes Yup's schema casting for trimming and lowercasing:

```typescript
// src/actions/auth/subprocesses/normalizeAuthInput.ts
import { SigninWithEmailRules, SigninWithPhoneRules } from "@/requests";

export function normalizeAuthInput(rawIdentifier: string, rawPassword: string): {
  identifier: string;
  password: string;
} {
  const isEmail = (rawIdentifier || "").includes("@");
  const schema = isEmail ? SigninWithEmailRules : SigninWithPhoneRules;

  const rawPayload = isEmail
    ? { email: rawIdentifier || "", password: rawPassword || "" }
    : { phone: rawIdentifier || "", password: rawPassword || "" };

  const casted = schema.cast(rawPayload) as {
    email?: string;
    phone?: string;
    password?: string;
  };

  return {
    identifier: (isEmail ? casted.email : casted.phone) || "",
    password: casted.password || "",
  };
}

export default normalizeAuthInput;
```

#### 2.2 Validation Subprocess
Synchronously validates against the matching schema:

```typescript
// src/actions/auth/subprocesses/validateAuthInput.ts
import { ValidationError } from "yup";
import { SigninWithEmailRules, SigninWithPhoneRules } from "@/requests";

export interface AuthValidationResult {
  isValid: boolean;
  errors: {
    identifier?: string;
    password?: string;
  };
}

export function validateAuthInput(identifier: string, password: string): AuthValidationResult {
  const isEmail = identifier.includes("@");
  const schema = isEmail ? SigninWithEmailRules : SigninWithPhoneRules;

  const payload = isEmail
    ? { email: identifier, password }
    : { phone: identifier, password };

  try {
    schema.validateSync(payload, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors: { identifier?: string; password?: string } = {};

    if (err instanceof ValidationError) {
      err.inner.forEach((validationError) => {
        if (validationError.path === "email" || validationError.path === "phone") {
          errors.identifier = validationError.message;
        } else if (validationError.path === "password") {
          errors.password = validationError.message;
        }
      });
    }

    return { isValid: false, errors };
  }
}

export default validateAuthInput;
```

#### 2.3 Preparation Subprocess
Formats clean data into `UserCredentialsInterface`:

```typescript
// src/actions/auth/subprocesses/prepareCredentials.ts
import type { UserCredentialsInterface } from "@/interfaces/AuthInterface";

export function prepareCredentials(identifier: string, password: string): UserCredentialsInterface {
  const isEmail = identifier.includes("@");
  return {
    channel_name: isEmail ? "email" : "phone",
    channel_value: identifier,
    password,
  };
}

export default prepareCredentials;
```

#### 2.4 Coordinator Subprocess
Coordinates normalization, validation, and preparation:

```typescript
// src/actions/auth/subprocesses/handleUserInput.ts
import type { UserCredentialsInterface } from "@/interfaces/AuthInterface";
import { normalizeAuthInput } from "./normalizeAuthInput";
import { validateAuthInput } from "./validateAuthInput";
import { prepareCredentials } from "./prepareCredentials";

export type HandleUserInputResult =
  | { success: true; credentials: UserCredentialsInterface; errors?: never }
  | { success: false; errors: { identifier?: string; password?: string }; credentials?: never };

export function handleUserInput(rawIdentifier: string, rawPassword: string): HandleUserInputResult {
  const { identifier, password } = normalizeAuthInput(rawIdentifier, rawPassword);
  const validation = validateAuthInput(identifier, password);

  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }

  const credentials = prepareCredentials(identifier, password);
  return { success: true, credentials };
}

export default handleUserInput;
```

---

### Step 3: UI-Facing Coordinator Hook (`useAuth`)

Serves as the gateway between the UI and all auth infrastructure:

```typescript
// src/actions/auth/useAuth.ts
import { useState, useCallback } from "react";
import { useSignInAction } from "./useSignInAction";
import { useOAuthLoginAction } from "./useOAuthLoginAction";
import { useGoogleOAuth } from "@/lib/oauth/useGoogleOAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { handleUserInput } from "./subprocesses/handleUserInput";
import type { AuthUserInterface } from "@/interfaces/AuthInterface";

export interface UseAuthReturn {
  signIn: (rawIdentifier: string, rawPassword: string) => Promise<boolean>;
  signInWithGoogle: () => void;
  isPending: boolean;
  isGooglePending: boolean;
  globalError: string | null;
  validationErrors: { identifier?: string; password?: string };
  serverErrors: Record<string, string | undefined>;
  clearErrors: () => void;
  user: AuthUserInterface | null;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ identifier?: string; password?: string }>({});

  const { serverErrors, clearServerErrors, loggedInUser, userIsSignedIn } = useAuthStore();
  const signInMutation = useSignInAction();
  const oauthMutation = useOAuthLoginAction();

  const clearErrors = useCallback(() => {
    setAuthErrorMessage(null);
    setValidationErrors({});
    clearServerErrors();
  }, [clearServerErrors]);

  const {
    signIn: triggerGoogleSignIn,
    isLoading: isGooglePopupOpen,
    setIsLoading: setIsGooglePopupOpen,
  } = useGoogleOAuth({
    onSuccess: (credentials) => {
      oauthMutation.mutate(
        {
          provider: "google",
          credential: credentials.id_token || credentials.access_token,
          id_token: credentials.id_token,
          access_token: credentials.access_token,
          device_name: "Web Browser",
        },
        {
          onError: () => {
            setIsGooglePopupOpen(false);
            setAuthErrorMessage("The email or password you entered is incorrect");
          },
          onSettled: () => setIsGooglePopupOpen(false),
        }
      );
    },
    onCancel: () => setIsGooglePopupOpen(false),
    onError: () => {
      setIsGooglePopupOpen(false);
      setAuthErrorMessage("The email or password you entered is incorrect");
    },
  });

  const isGooglePending = isGooglePopupOpen || oauthMutation.isPending;
  const isPending = signInMutation.isPending || isGooglePending;

  // OWASP: Generic error message to prevent user enumeration
  const globalError =
    authErrorMessage ||
    (serverErrors.email || serverErrors.password || serverErrors.phone
      ? "The email or password you entered is incorrect"
      : null);

  const signIn = useCallback(
    async (rawIdentifier: string, rawPassword: string): Promise<boolean> => {
      clearErrors();

      const result = handleUserInput(rawIdentifier, rawPassword);

      if (!result.success && result.errors) {
        setValidationErrors(result.errors);
        setAuthErrorMessage("The email or password you entered is incorrect");
        return false;
      }

      try {
        if (result.credentials) {
          await signInMutation.mutateAsync(result.credentials);
        }
        return true;
      } catch {
        setAuthErrorMessage("The email or password you entered is incorrect");
        return false;
      }
    },
    [clearErrors, signInMutation]
  );

  return {
    signIn,
    signInWithGoogle: triggerGoogleSignIn,
    isPending,
    isGooglePending,
    globalError,
    validationErrors,
    serverErrors,
    clearErrors,
    user: loggedInUser,
    isAuthenticated: userIsSignedIn,
  };
}

export default useAuth;
```

---

### Step 4: Presentation Layer (`LoginForm.tsx`)

Thin presentation component with uncontrolled inputs:

```tsx
// src/components/auth/LoginForm.tsx
import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { FiEye, FiEyeOff, FiAlertCircle } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { Input } from "../shared/Input";
import { Button } from "../shared/Button";
import { useAuth } from "@/actions/auth/useAuth";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  // Uncontrolled references — 0 keystroke re-renders
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const {
    signIn,
    signInWithGoogle,
    isPending,
    isGooglePending,
    globalError,
  } = useAuth();

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const identifier = identifierInputRef.current?.value || "";
    const password = passwordInputRef.current?.value || "";
    await signIn(identifier, password);
  };

  return (
    <div className="w-full max-w-[372px] 2xl:max-w-[465px] transition-all duration-300">
      <h2 className="text-[19px] md:text-[22px] 2xl:text-[24px] font-bold text-[#250A63] mb-8 2xl:mb-[40px] mt-5 2xl:mt-[25px] text-center font-geist">
        Signin to Bitnormous Business
      </h2>

      {/* OWASP-compliant Global Error Alert */}
      {globalError && (
        <div className="mb-6 2xl:mb-[30px] p-3.5 2xl:p-4 rounded-[8px] bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-3 text-[#B91C1C] text-[13px] 2xl:text-[15px] font-geist font-medium">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-[#EF4444]" />
          <span>{globalError}</span>
        </div>
      )}

      <form className="space-y-5 2xl:space-y-[25px]" onSubmit={handleSignIn}>
        <Input
          ref={identifierInputRef}
          name="identifier"
          label="Email or Phone"
          type="text"
          placeholder="ipexMike@gmail.com"
          autoComplete="username"
        />

        <Input
          ref={passwordInputRef}
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Minimum 8 characters"
          endIcon={showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
          onEndIconClick={() => setShowPassword((prev) => !prev)}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isPending}
          className="mt-10! 2xl:mt-[50px]! bg-[#292929] disabled:opacity-50 cursor-pointer"
        >
          {isPending && !isGooglePending ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="flex items-center my-6 2xl:my-[30px]">
        <div className="flex-1 border-t border-[#F1F5F9]" />
        <span className="px-4 text-[13px] 2xl:text-[16px] text-[#94A3B8] font-geist">or</span>
        <div className="flex-1 border-t border-[#F1F5F9]" />
      </div>

      <Button
        type="button"
        variant="accent"
        fullWidth
        onClick={signInWithGoogle}
        disabled={isPending}
        className="gap-3 text-[14px] 2xl:text-[18px] text-[#1E1E1E] cursor-pointer disabled:opacity-60"
      >
        {isGooglePending ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin text-[#1E1E1E]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting to Google...</span>
          </div>
        ) : (
          <>
            <FcGoogle className="w-[20px] h-[20px]" />
            <span>Sign in with Google</span>
          </>
        )}
      </Button>

      <p className="mt-8 text-center text-[12px] 2xl:text-[15px] text-[#94A3B8] leading-relaxed font-geist">
        By clicking the button above, you agree to our Terms of<br />Service and Privacy Policy
      </p>
    </div>
  );
};

export default LoginForm;
```

---

### Step 5: Input Autofill Normalization (`Input.tsx`)

Scoped Tailwind utilities override the browser's light blue autofill tint without touching global CSS:

```tsx
// src/components/shared/Input.tsx
import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endIcon?: ReactNode;
  onEndIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, endIcon, onEndIconClick, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-2 2xl:space-y-2.5 w-full transition-all duration-300">
        {label && (
          <label className="text-[13px] 2xl:text-[16px] font-medium text-[#1E1E1E] font-geist">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            className={`h-[44px] 2xl:h-[55px] px-[16px] 2xl:px-[20px] w-full rounded-[6px] 2xl:rounded-[7.5px] border ${
              error ? "border-red-500" : "border-[#CBD5E1]"
            } bg-[#FFFEFE] text-sm 2xl:text-[18px] text-[#1E1E1E] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#250A63] font-geist font-normal transition-all duration-300 autofill:shadow-[inset_0_0_0_1000px_#FFFEFE] autofill:[-webkit-text-fill-color:#1E1E1E] ${
              endIcon ? "pr-10 2xl:pr-[50px]" : ""
            } ${className}`}
            {...props}
          />
          {endIcon && (
            <button
              type="button"
              onClick={onEndIconClick}
              className="absolute right-3 2xl:right-[15px] top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] focus:outline-none"
            >
              {endIcon}
            </button>
          )}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

---

### Step 6: Google OAuth & Popup Lifecycle Tracking

In `src/lib/oauth/useGoogleOAuth.ts` and `src/lib/oauth/googleBridge.ts`:
- Sets `isLoading = true` the moment the user clicks *"Sign in with Google"*.
- Detects `isUserCancellation()` when the user closes the popup window without completing login (`popup_closed`, `cancel`, `user_cancel`), immediately resetting `isLoading = false`.
- If the token is acquired, keeps the button in a loading state until the backend mutation settles.

---

## 5. Maintenance & Extensibility Guide

### Adding a New Validation Rule
To add a new rule (e.g., password must contain a number):
1. Open `src/requests/SigninRequestRules.ts`.
2. Add `.matches(/\d/, "Password must contain at least one number")` to `SigninWithEmailRules` and `SigninWithPhoneRules`.
3. Done. The entire subprocess pipeline automatically inherits the rule.

### Adding a New Social Provider
To add Apple or Microsoft login:
1. Create a bridge loader under `src/lib/oauth/appleBridge.ts`.
2. Register the provider in `src/lib/oauth/index.ts`.
3. Add `signInWithApple` in `src/actions/auth/useAuth.ts` mapping to `useOAuthLoginAction({ provider: "apple" })`.
4. Render the button in `LoginForm.tsx`.

### Adding Two-Factor Authentication (2FA / OTP)
If the backend returns a 2FA challenge (e.g. status code 200 with `{ requires_2fa: true, session_token }`):
1. In `useSignInAction.ts`, check for `response.data.requires_2fa`.
2. If present, set temporary state in `useAuthStore` and redirect to `/verify-otp`.
3. Use existing `useOTPverificationAction.ts`.

---

## 6. Learning Resources & Authoritative References

### Security & Authentication
- **OWASP Authentication Cheat Sheet**:  
  [https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)  
  *Covers best practices on generic error messages, password lengths, and preventing user enumeration.*
- **OWASP Credential Stuffing Prevention**:  
  [https://owasp.org/www-community/attacks/Credential_stuffing](https://owasp.org/www-community/attacks/Credential_stuffing)

### React Performance & State Management
- **React Official Documentation — Uncontrolled Components**:  
  [https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components)  
  *Explains when to let the DOM hold form state vs. storing values in React state.*
- **React Official Documentation — Preserving and Resetting State**:  
  [https://react.dev/learn/preserving-and-resetting-state](https://react.dev/learn/preserving-and-resetting-state)
- **Kent C. Dodds — The State Initializer Pattern & When to use Controlled vs Uncontrolled**:  
  [https://kentcdodds.com/blog/controlled-vs-uncontrolled](https://kentcdodds.com/blog/controlled-vs-uncontrolled)

### Server State & TanStack Query
- **TanStack Query (React Query) v5 Official Docs**:  
  [https://tanstack.com/query/latest/docs/framework/react/guides/mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)  
  *Detailed guide on asynchronous server mutations, optimistic updates, and side-effect handling.*
- **TkDodo's Practical React Query Blog**:  
  [https://tkdodo.eu/blog/practical-react-query](https://tkdodo.eu/blog/practical-react-query)  
  *The authoritative guide on separating server state from local UI client state.*

### Schema Validation (Yup)
- **Yup GitHub Documentation & API Reference**:  
  [https://github.com/jquense/yup](https://github.com/jquense/yup)  
  *Reference for `.cast()`, `.transform()`, `.validateSync()`, and custom `.test()` validation.*

### CSS & Styling
- **Tailwind CSS v4 Documentation — Form & State Variants**:  
  [https://tailwindcss.com/docs/hover-focus-and-other-states#autofill](https://tailwindcss.com/docs/hover-focus-and-other-states#autofill)  
  *Details on styling `:-webkit-autofill` states using Tailwind utility classes.*
- **MDN Web Docs — `:-webkit-autofill`**:  
  [https://developer.mozilla.org/en-US/docs/Web/CSS/:autofill](https://developer.mozilla.org/en-US/docs/Web/CSS/:autofill)  
  *Explains browser user-agent autofill injection mechanisms.*

### Architecture Principles
- **Clean Architecture by Robert C. Martin (Uncle Bob)**:  
  *Core concepts of Dependency Inversion, Single Responsibility, and separating presentation from business logic.*
