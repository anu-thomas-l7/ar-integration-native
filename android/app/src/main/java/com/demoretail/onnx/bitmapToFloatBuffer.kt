package com.demoretail.onnx

import android.graphics.Bitmap
import java.nio.FloatBuffer
fun bitmapToFloatBuffer(bitmap: Bitmap): FloatBuffer {
    val width = bitmap.width
    val height = bitmap.height
    val floatValues = FloatBuffer.allocate(3 * height * width)
    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

    // Fill R channel
    for (y in 0 until height) {
        for (x in 0 until width) {
            val idx = y * width + x
            val pixel = pixels[idx]
            val r = ((pixel shr 16) and 0xFF) / 255.0f
            floatValues.put(r)
        }
    }

    // Fill G channel
    for (y in 0 until height) {
        for (x in 0 until width) {
            val idx = y * width + x
            val pixel = pixels[idx]
            val g = ((pixel shr 8) and 0xFF) / 255.0f
            floatValues.put(g)
        }
    }

    // Fill B channel
    for (y in 0 until height) {
        for (x in 0 until width) {
            val idx = y * width + x
            val pixel = pixels[idx]
            val b = (pixel and 0xFF) / 255.0f
            floatValues.put(b)
        }
    }

    floatValues.rewind()
    return floatValues
}
