import { addPropertyControls, ControlType } from "framer"
import { useMotionValueEvent, useScroll } from "framer-motion"
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"

interface Props {
    filepath?: string
    targetId: string
    objectFit?: "cover" | "contain"
    style?: CSSProperties
}

// Resolve the target element after mount and pass it to the video scrubber.
export function ScrollScrubVideo({ targetId, ...props }: Props) {
    const [target, setTarget] = useState<HTMLElement | null>(null)

    useEffect(() => {
        setTarget(targetId ? document.getElementById(targetId) : null)
    }, [targetId])

    return <Scrubber key={target ? targetId : ""} target={target} {...props} />
}

function Scrubber({
    filepath,
    target,
    objectFit = "contain",
    style,
}: Omit<Props, "targetId"> & { target: HTMLElement | null }) {
    const targetRef = useRef(target)
 
    // Track scroll progress through the target element.
    const { scrollYProgress: progress } = useScroll(
        target
            ? { target: targetRef, offset: ["start start", "end end"] }
            : undefined
    )
    const videoRef = useRef<HTMLVideoElement>(null)

    // Map scroll progress (0–1) to the video's timeline once its duration is available.
    const seek = useCallback((value: number) => {
        const video = videoRef.current
        if (video && Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = value * video.duration
        }
    }, [])

    useMotionValueEvent(progress, "change", seek)

    return (
        <video
            ref={videoRef}
            style={{ objectFit, ...style }}
            src={filepath}
            preload="auto"
            muted
            playsInline
            onLoadedMetadata={() => seek(progress.get())}
        />
    )
}

// Register the component's Framer property controls.
addPropertyControls(ScrollScrubVideo, {
    filepath: {
        type: ControlType.File,
        allowedFileTypes: ["mp4"],
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["contain", "cover"],
        optionTitles: ["Contain", "Cover"],
        defaultValue: "contain",
        displaySegmentedControl: true,
    },
    targetId: {
        type: ControlType.String,
        title: "Target ID",
        placeholder: "Element ID",
    },
})