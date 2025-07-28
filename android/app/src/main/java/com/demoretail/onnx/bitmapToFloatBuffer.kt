package com.demoretail.onnx

import android.graphics.Bitmap
import java.nio.FloatBuffer

fun bitmapToFloatBuffer(bitmap: Bitmap): FloatBuffer {
    val width = bitmap.width
    val height = bitmap.height
    val inputSize = width * height * 3
    val buffer = FloatBuffer.allocate(inputSize)

    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

    for (pixel in pixels) {
        val r = ((pixel shr 16) and 0xFF) / 255.0f
        val g = ((pixel shr 8) and 0xFF) / 255.0f
        val b = (pixel and 0xFF) / 255.0f
        buffer.put(r)
        buffer.put(g)
        buffer.put(b)
    }

    buffer.rewind()
    return buffer
}
