const CONFIDENCE_THRESHOLD = 0.65;

export function extractKeypoints(output) {
  const simccXArray = output.simcc_x.data;
  const simccYArray = output.simcc_y.data;

  const numKeypoints = output.simcc_x.dims[1];
  const widthX = output.simcc_x.dims[2];
  const widthY = output.simcc_y.dims[2];

  const keypoints = {};

  for (let k = 0; k < numKeypoints; k++) {
    let maxX = -Infinity;
    let maxXIndex = -1;
    for (let w = 0; w < widthX; w++) {
      const value = simccXArray[k * widthX + w];
      if (value > maxX) {
        maxX = value;
        maxXIndex = w;
      }
    }

    let maxY = -Infinity;
    let maxYIndex = -1;
    for (let w = 0; w < widthY; w++) {
      const value = simccYArray[k * widthY + w];
      if (value > maxY) {
        maxY = value;
        maxYIndex = w;
      }
    }

    const confidence = 0.5 * (maxX + maxY);

    if (confidence > CONFIDENCE_THRESHOLD) {
      keypoints[getBodyPartName(k)] = {
        x: maxXIndex * (640 / widthX), // Assuming your preview width = 640
        y: maxYIndex * (480 / widthY), // Assuming your preview height = 480
      };
    }
  }

  return keypoints;
}

function getBodyPartName(index) {
  switch (index) {
    case 18:
      return 'Neck';
    case 3:
      return 'Left ear';
    case 4:
      return 'Right ear';
    default:
      return `Keypoint_${index}`;
  }
}
