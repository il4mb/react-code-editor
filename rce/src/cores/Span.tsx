import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react"

interface BaseProps<T extends ElementType> {
    as?: T
    children?: React.ReactNode
    segments: {
        start: number
        end: number
    }
}

export type SpanProps<T extends ElementType> = BaseProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof BaseProps<T>>

export default function Span<T extends ElementType = "span">({ children, as, segments, ...props }: SpanProps<T>) {
    const Component = as || "span";
    return <Component {...props} data-segment-start={segments.start} data-segment-end={segments.end}>{children}</Component>
}