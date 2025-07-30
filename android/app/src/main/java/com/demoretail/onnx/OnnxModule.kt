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
                ortSession = ortEnv.createSession(model)
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
            val scaledBitmap = Bitmap.createScaledBitmap(bitmap, 256,192
            , false)
            Log.d("bitmap", "bitmap : ${bitmap.width} x ${bitmap.height}")
            Log.d("scaledBitmap", "scaledBitmap : ${scaledBitmap.width} x ${scaledBitmap.height}")
           
            val inputMeta = ortSession!!.inputInfo
            for ((name, info) in inputMeta) {
                Log.d("ONNX_INPUT", "$name -> ${info.info}")
            }
 

            val inputName = ortSession!!.inputNames.iterator().next()
            val inputTensor = bitmapToFloatBuffer(scaledBitmap)
            val shape = longArrayOf(1, 3, 256, 192)
            val tensor = OnnxTensor.createTensor(ortEnv, inputTensor, shape)
            val output = ortSession!!.run(mapOf(inputName to tensor))

            for ((name, result) in output) {
                if (result is OnnxTensor) {
                    Log.d("ONNX_OUTPUT", "Output name: $name")
                    Log.d("ONNX_OUTPUT", "Tensor type: ${result.info}")
                } else {
                    Log.d("ONNX_OUTPUT", "Output $name is not a tensor")
                }
            }
            // val simccXOutput = output["simcc_x"]
            val simccXOutput = output.get(0)
            val simccYOutput = output.get(1)
            Log.d("simccYOutput", "simccYOutput is: $simccYOutput")
            Log.d("simccXOutput", "simccXOutput is: $simccXOutput")
            if (simccXOutput !is OnnxTensor || simccYOutput !is OnnxTensor) {
                promise.reject("ONNX_OUTPUT_ERROR", "Output is not a tensor")
                return
            }
            val simccX = simccXOutput.value as Array<Array<FloatArray>>
            val simccY = simccYOutput.value as Array<Array<FloatArray>>
            for (i in simccX.indices) {
                for (j in simccX[i].indices) {
                    val xRow = simccX[i][j].joinToString(", ") { "%.4f".format(it) }
                    val yRow = simccY[i][j].joinToString(", ") { "%.4f".format(it) }
                    Log.d("ONNX_X", "Keypoint $i-$j X: [$xRow]")
                    Log.d("ONNX_Y", "Keypoint $i-$j Y: [$yRow]")
                }
            }
            // Extract coordinates
            val keypointsX = simccX[0]
            val keypointsY = simccY[0]
            Log.d("keypointsX", "keypointsX is: $keypointsX")
            Log.d("keypointsY", "keypointsY is: $keypointsY")
            val resultMap = Arguments.createMap()
            val bodyPartMap = mapOf(
                "Neck" to 18,
                "LeftEar" to 3,
                "RightEar" to 4
            )
            // ✅ Scaling ratios (original / scaled)
            val widthRatio = bitmap.width.toFloat() / scaledBitmap.width.toFloat()
            val heightRatio = bitmap.height.toFloat() / scaledBitmap.height.toFloat()
            Log.d("widthRatio", "widthRatio is: $widthRatio")
            Log.d("heightRatio", "heightRatio is: $heightRatio")

            for ((label, index) in bodyPartMap) {
                val coords = extractCoordinates(keypointsX, keypointsY, index, scaledBitmap)
                if (coords != null) {
                    // val scaledX = coords.first * widthRatio   // 🔁 scale up X
                    // val scaledY = coords.second * heightRatio // 🔁 scale up Y
                    val scaledX = coords.first // 🔁 scale up X
                    val scaledY = coords.second
 
                    val pointMap = Arguments.createMap()
                    //pointMap.putDouble("x", coords.first.toDouble())
                    pointMap.putDouble("x", scaledX.toDouble())
                    //pointMap.putDouble("y", coords.second.toDouble())
                    pointMap.putDouble("y", scaledY.toDouble())
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
 
        Log.d("ONNX_Y_PROBS", "Keypoint $keypointIndex: ${yData.joinToString(", ") { "%.2f".format(it) }}")
 

        val xIndex = xData.indices.maxByOrNull { xData[it] } ?: return null
        val yIndex = yData.indices.maxByOrNull { yData[it] } ?: return null
        val x = xIndex.toFloat() / xData.size * bitmap.width
        val y = yIndex.toFloat() / yData.size * bitmap.height
        return Pair(x, y)
    }

}