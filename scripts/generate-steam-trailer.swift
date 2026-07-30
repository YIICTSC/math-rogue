import AppKit
import AVFoundation
import CoreGraphics
import CoreText
import CoreVideo
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
let screenshotDir = root.appendingPathComponent("release/steam/store-assets/screenshots", isDirectory: true)
let outputDir = root.appendingPathComponent("release/steam/store-assets/trailer", isDirectory: true)
let previewDir = root.appendingPathComponent("build/steam-trailer-previews", isDirectory: true)
try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)
try FileManager.default.createDirectory(at: previewDir, withIntermediateDirectories: true)

let slides: [(file: String, title: String)] = [
    ("01-title.jpg", "学ぶほど、冒険が進む。"),
    ("02-mode-selection.jpg", "学年とテーマを選んで冒険へ"),
    ("03-adventure-map.jpg", "学校を舞台に進むローグライク"),
    ("04-card-battle.jpg", "集めたカードで戦略バトル"),
    ("05-learning-quiz.jpg", "正解が次の一手につながる"),
    ("06-card-battle.jpg", "小学生編・高校編・マジック編"),
    ("07-learning-quiz.jpg", "学習と多彩なミニゲームを一本に"),
]

func loadCGImage(_ url: URL) throws -> CGImage {
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil)
    else {
        throw NSError(domain: "SteamTrailer", code: 1, userInfo: [
            NSLocalizedDescriptionKey: "Unable to load \(url.path)",
        ])
    }
    return cgImage
}

let images = try slides.map { try loadCGImage(screenshotDir.appendingPathComponent($0.file)) }
let width = 1920
let height = 1080
let fps: Int32 = 30
let slideSeconds = 4.0
let totalSeconds = Double(slides.count) * slideSeconds
let frameCount = Int(totalSeconds * Double(fps))

let silentURL = outputDir.appendingPathComponent("learning-rogue-trailer-silent.mp4")
let finalURL = outputDir.appendingPathComponent("learning-rogue-gameplay-trailer.mp4")
try? FileManager.default.removeItem(at: silentURL)
try? FileManager.default.removeItem(at: finalURL)

let writer = try AVAssetWriter(outputURL: silentURL, fileType: .mp4)
let videoSettings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 12_000_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
    ]
)
guard writer.canAdd(input) else {
    throw NSError(domain: "SteamTrailer", code: 2, userInfo: [
        NSLocalizedDescriptionKey: "Unable to add video input",
    ])
}
writer.add(input)
guard writer.startWriting() else {
    throw writer.error ?? NSError(domain: "SteamTrailer", code: 3)
}
writer.startSession(atSourceTime: .zero)

let colorSpace = CGColorSpaceCreateDeviceRGB()
let font = CTFontCreateWithName("HiraginoSans-W6" as CFString, 54, nil)

func drawFrame(slideIndex: Int, progress: Double, into buffer: CVPixelBuffer) {
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else { return }

    context.setFillColor(NSColor.black.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))

    let image = images[slideIndex]
    let baseScale = max(
        CGFloat(width) / CGFloat(image.width),
        CGFloat(height) / CGFloat(image.height)
    )
    let zoom = baseScale * CGFloat(1.0 + (0.045 * progress))
    let drawWidth = CGFloat(image.width) * zoom
    let drawHeight = CGFloat(image.height) * zoom
    let panDirection: CGFloat = slideIndex.isMultiple(of: 2) ? 1 : -1
    let pan = panDirection * CGFloat(progress - 0.5) * 24
    let rect = CGRect(
        x: (CGFloat(width) - drawWidth) / 2 + pan,
        y: (CGFloat(height) - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight
    )
    context.draw(image, in: rect)

    let bandHeight: CGFloat = 154
    let gradientColors = [
        NSColor.black.withAlphaComponent(0.12).cgColor,
        NSColor.black.withAlphaComponent(0.90).cgColor,
    ] as CFArray
    if let gradient = CGGradient(
        colorsSpace: colorSpace,
        colors: gradientColors,
        locations: [0, 1]
    ) {
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: 0, y: bandHeight),
            end: CGPoint(x: 0, y: 0),
            options: []
        )
    }

    let attributes: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: NSColor.white,
        .kern: 1.2,
    ]
    let line = CTLineCreateWithAttributedString(
        NSAttributedString(string: slides[slideIndex].title, attributes: attributes)
    )
    let lineWidth = CGFloat(CTLineGetTypographicBounds(line, nil, nil, nil))
    context.textPosition = CGPoint(x: (CGFloat(width) - lineWidth) / 2, y: 48)
    CTLineDraw(line, context)

    let fadeDuration = 0.22
    let alpha: CGFloat
    if progress < fadeDuration {
        alpha = CGFloat(1 - (progress / fadeDuration))
    } else if progress > 1 - fadeDuration {
        alpha = CGFloat((progress - (1 - fadeDuration)) / fadeDuration)
    } else {
        alpha = 0
    }
    if alpha > 0 {
        context.setFillColor(NSColor.black.withAlphaComponent(alpha).cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    }
}

for frame in 0..<frameCount {
    while !input.isReadyForMoreMediaData {
        Thread.sleep(forTimeInterval: 0.002)
    }
    guard let pool = adaptor.pixelBufferPool else {
        throw NSError(domain: "SteamTrailer", code: 4)
    }
    var pixelBuffer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pixelBuffer)
    guard let buffer = pixelBuffer else {
        throw NSError(domain: "SteamTrailer", code: 5)
    }

    let seconds = Double(frame) / Double(fps)
    let slideIndex = min(Int(seconds / slideSeconds), slides.count - 1)
    let progress = (seconds.truncatingRemainder(dividingBy: slideSeconds)) / slideSeconds
    drawFrame(slideIndex: slideIndex, progress: progress, into: buffer)
    let presentationTime = CMTime(value: CMTimeValue(frame), timescale: fps)
    guard adaptor.append(buffer, withPresentationTime: presentationTime) else {
        throw writer.error ?? NSError(domain: "SteamTrailer", code: 6)
    }
}

input.markAsFinished()
let writerFinished = DispatchSemaphore(value: 0)
writer.finishWriting { writerFinished.signal() }
writerFinished.wait()
guard writer.status == .completed else {
    throw writer.error ?? NSError(domain: "SteamTrailer", code: 7)
}

let videoAsset = AVURLAsset(url: silentURL)
let audioAsset = AVURLAsset(url: root.appendingPathComponent("public/bgm/menu.mp3"))
let composition = AVMutableComposition()
let duration = CMTime(seconds: totalSeconds, preferredTimescale: 600)

if let sourceVideo = try await videoAsset.loadTracks(withMediaType: .video).first,
   let targetVideo = composition.addMutableTrack(
       withMediaType: .video,
       preferredTrackID: kCMPersistentTrackID_Invalid
   ) {
    try targetVideo.insertTimeRange(
        CMTimeRange(start: .zero, duration: duration),
        of: sourceVideo,
        at: .zero
    )
}

if let sourceAudio = try await audioAsset.loadTracks(withMediaType: .audio).first,
   let targetAudio = composition.addMutableTrack(
       withMediaType: .audio,
       preferredTrackID: kCMPersistentTrackID_Invalid
   ) {
    let audioDuration = try await audioAsset.load(.duration)
    var cursor = CMTime.zero
    while cursor < duration {
        let remaining = CMTimeSubtract(duration, cursor)
        let chunk = CMTimeMinimum(audioDuration, remaining)
        try targetAudio.insertTimeRange(
            CMTimeRange(start: .zero, duration: chunk),
            of: sourceAudio,
            at: cursor
        )
        cursor = CMTimeAdd(cursor, chunk)
    }
}

guard let export = AVAssetExportSession(
    asset: composition,
    presetName: AVAssetExportPresetHighestQuality
) else {
    throw NSError(domain: "SteamTrailer", code: 8)
}
export.outputURL = finalURL
export.outputFileType = .mp4
export.shouldOptimizeForNetworkUse = true
let exportFinished = DispatchSemaphore(value: 0)
export.exportAsynchronously { exportFinished.signal() }
exportFinished.wait()
guard export.status == .completed else {
    throw export.error ?? NSError(domain: "SteamTrailer", code: 9)
}

let finalAsset = AVURLAsset(url: finalURL)
let imageGenerator = AVAssetImageGenerator(asset: finalAsset)
imageGenerator.appliesPreferredTrackTransform = true
for (index, second) in [1.5, 9.5, 17.5, 25.5].enumerated() {
    let cgImage = try imageGenerator.copyCGImage(
        at: CMTime(seconds: second, preferredTimescale: 600),
        actualTime: nil
    )
    let bitmap = NSBitmapImageRep(cgImage: cgImage)
    guard let png = bitmap.representation(using: .png, properties: [:]) else { continue }
    try png.write(to: previewDir.appendingPathComponent(
        String(format: "preview-%02d.png", index + 1)
    ))
}

try? FileManager.default.removeItem(at: silentURL)
print("Generated \(finalURL.path)")
print(String(format: "Duration: %.1f seconds, 1920x1080, H.264 + game BGM", totalSeconds))
