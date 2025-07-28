package com.demoretail.onnx

import com.demoretail.R
import ai.onnxruntime.*
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.*
import java.nio.FloatBuffer
import android.util.Log


class OnnxModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val ortEnv: OrtEnvironment = OrtEnvironment.getEnvironment()
    private var ortSession: OrtSession? = null

    override fun getName() = "OnnxModule"

    @ReactMethod
    fun loadModel(promise: Promise) {
    try {
        if (ortSession == null) {
            val model = reactContext.assets.open("end2end.onnx").readBytes()
            
            ortSession  = ortEnv.createSession(model)
            promise.resolve("Model loaded successfully")
        } else {
            promise.resolve("Model already loaded")
        }
    } catch (e: Exception) {
        promise.reject("LOAD_MODEL_ERROR", "Failed to load model: ${e.message}")
    }
}


    init {
        try {
            // Load ONNX model from res/raw
            val modelBytes: ByteArray = reactContext.resources.openRawResource(R.raw.end2end).readBytes()
            ortSession = ortEnv.createSession(modelBytes)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun runModelFromBase64(base64Image: String, promise: Promise) {
        try {
            if (ortSession == null) {
                promise.reject("ONNX_SESSION_ERROR", "ONNX model not initialized")
                return
            }

            val decodedBytes = Base64.decode(base64Image, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 192, 256, false)

            val inputName = ortSession!!.inputNames.iterator().next()
            val inputTensor = bitmapToFloatBuffer(scaledBitmap)
            val shape = longArrayOf(1, 3, 256, 192)

            val tensor = OnnxTensor.createTensor(ortEnv, inputTensor, shape)
            val output = ortSession!!.run(mapOf(inputName to tensor))

           Log.d("ONNX_OUTPUT", "Output count: ${output}")

            output.forEachIndexed { index, result ->
                Log.d("ONNX_OUTPUT", "Output [$index]: ${result.javaClass.name}")
            }



            val simccXOutput = output.get("simcc_x")
            val simccYOutput = output.get("simcc_y")

        if (simccXOutput !is OnnxTensor || simccYOutput !is OnnxTensor) {
        promise.reject("ONNX_OUTPUT_ERROR", "Output is not a tensor")
            return
        }

            val simccXTensor = simccXOutput as OnnxTensor
            val simccYTensor = simccYOutput as OnnxTensor

            val simccX = (simccXTensor.value as Array<Array<FloatArray>>)[0]
            val simccY = (simccYTensor.value as Array<Array<FloatArray>>)[0]

            val resultMap = Arguments.createMap()
            val bodyPartMap = mapOf(
                "Neck" to 18,
                "LeftEar" to 3,
                "RightEar" to 4
            )

            for ((label, index) in bodyPartMap) {
                val coords = extractCoordinates(simccX, simccY, index, scaledBitmap)
                if (coords != null) {
                    val pointMap = Arguments.createMap()
                    pointMap.putDouble("x", coords.first.toDouble())
                    pointMap.putDouble("y", coords.second.toDouble())
                    resultMap.putMap(label, pointMap)
                }
            }

            promise.resolve(resultMap)
        } catch (e: Exception) {
            promise.reject("ONNX_ERROR", "Failed to run ONNX model", e)
        }
    }

    private fun extractCoordinates(
        simccXArray: Array<FloatArray>,
        simccYArray: Array<FloatArray>,
        keypointIndex: Int,
        bitmap: Bitmap
    ): Pair<Float, Float>? {
        val xData = simccXArray[keypointIndex]
        val yData = simccYArray[keypointIndex]

        val xIndex = xData.indices.maxByOrNull { xData[it] } ?: return null
        val yIndex = yData.indices.maxByOrNull { yData[it] } ?: return null

        val x = xIndex.toFloat() / xData.size * bitmap.width
        val y = yIndex.toFloat() / yData.size * bitmap.height

        return Pair(x, y)
    }
}
