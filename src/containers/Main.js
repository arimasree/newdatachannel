import { Button, Card, Grid, makeStyles } from "@material-ui/core";
import React, { useState, useRef } from "react";

import config from "../config";
import AccordionList from "../components/AccordionList";
import Annotation from "../components/Annotation";
import VideoCall from "../components/VideoCall";
import { Tools } from "../annotations";

const useStyles = makeStyles({
  root: {
    marginTop: 20,
  },
  canvas: {
    height: 600,
    width: 300,
  },
  tools: {
    height: 600,
    width: 100,
    backgroundColor: "black",
    color: "#fff",
    textAlign: "center",
  },
  toolSelected: {
    backgroundColor: "#3F51B5",
  },
  tool: {
    borderTop: "0.5px solid #fff",
  },
  toolImg: {
    width: "65%",
  },
  grid: {
    height: 600,
    width: 300,
  },
  toolBtn: {
    marginBottom: 25,
    width: 175,
  },
  thumbnail: {
    marginBottom: 25,
    width: 50,
    height: 75,
  },
  snapShot: {
    maxWidth: "100%",
    maxHeight: "100%",
    cursor: "pointer",
  },
});

function Main() {
  const classes = useStyles();

  const [sketch, setSketch] = useState(null);
  const [tool, setTool] = useState("Pencil");

  const [isLaserBeam, setLaserBeam] = useState(false);
  const videoCallRef = useRef();

  const sendData = (data) => {
    if (videoCallRef.current) {
      videoCallRef.current.sendData(data);
    } else {
      console.log("Data channel not ready");
    }
  };

  const handleAnnotations = () => {
    if (sketch) {
      const {
        objects: [properties],
      } = sketch.toJSON();
      if (properties) {
        let data = { tool };
        if (tool === "Select") {
          data.tool = "Text";
          ["height", "width", "left", "top", "text"].forEach(
            (field) => (data[field] = properties[field])
          );
        } else {
          const [{ fields }] = config.ANNOTATIONS.filter(
            (annotation) => annotation.tool === tool
          );
          fields.forEach((field) => (data[field] = properties[field]));
          sketch._fc._objects = []; //  Clear Previous Annotation
        }
        return sendData({ ...data });
      }
    }
  };

  const handleLaserBeamClick = () => {
    if (sketch) sketch.clear();
    setTool(null);
    setLaserBeam(true);
  };

  const handleLaserBeam = ({ screenX, screenY }) => {
    if (sketch && isLaserBeam) {
      return sendData({
        tool: "Laser",
        x: screenX,
        y: screenY,
      });
    }
  };

  const handleClear = () => {
    if (sketch) {
      sketch.clear();
      return sendData({ tool: "Clear" });
    }
  };

  const handleText = () => {
    if (sketch) {
      sketch.clear();
      setLaserBeam(false);
      sketch.addText("Edit Text");
      setTool("Select");
    }
  };

  return (
    <Grid className={classes.root} container justify="center">
      <Grid item>
        <Card>
          <Grid
            container
            className={classes.canvas}
            justify="center"
            spacing={2}
            id="snapShot"
            onMouseMoveCapture={handleLaserBeam}
            disabled={isLaserBeam}
          >
            <VideoCall ref={videoCallRef} />
            <Annotation
              ref={(c) => setSketch(c)}
              tool={Tools[tool]}
              lineWidth={2}
              onChange={handleAnnotations}
              height={600}
              width={300}
            />
          </Grid>
        </Card>
      </Grid>
      <Grid item>
        <Card>
          <Grid
            container
            className={classes.tools}
            justify="center"
            spacing={2}
          >
            <Grid item>
              <p>
                <b>Tools</b>
              </p>
            </Grid>
            {config.ANNOTATIONS.map((annotation) => (
              <Grid
                item
                className={
                  tool === annotation.tool ? classes.toolSelected : classes.tool
                }
                key={annotation.tool}
                onClick={() => {
                  setLaserBeam(false);
                  setTool(annotation.tool);
                }}
              >
                <Button>
                  <img
                    className={classes.toolImg}
                    src={`/toolImages/${annotation.tool.toLowerCase()}.png`}
                    alt={annotation.tool}
                  />
                </Button>
              </Grid>
            ))}
            <Grid
              item
              className={isLaserBeam ? classes.toolSelected : classes.tool}
              onClick={handleLaserBeamClick}
            >
              <Button>
                <img
                  className={classes.toolImg}
                  src={"/toolImages/laser_beam.png"}
                  alt="Laser Beam"
                />
              </Button>
            </Grid>
            <Grid
              item
              className={
                tool === "Select" ? classes.toolSelected : classes.tool
              }
              onClick={handleText}
            >
              <Button>
                <img
                  className={classes.toolImg}
                  src={"/toolImages/text.png"}
                  alt="Text"
                />
              </Button>
            </Grid>
            <Grid item className={classes.tool} onClick={handleClear}>
              <Button>
                <img
                  className={classes.toolImg}
                  src={"/toolImages/undo.png"}
                  alt="Undo"
                />
              </Button>
            </Grid>
            <Grid item className={classes.tool}>
              <p>More</p>
              <Button>
                <img src={"/toolImages/more.png"} alt="More" />
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Grid>
      <AccordionList />
    </Grid>
  );
}

export default Main;
