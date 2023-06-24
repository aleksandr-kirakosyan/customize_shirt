import React, { useEffect, useState } from "react";
import {AnimatePresence, motion} from 'framer-motion';
import {useSnapshot} from 'valtio';
import config from '../config/config';
import state from '../store';
import { download } from '../assets';
import { downloadCanvasToImage, reader} from '../config/helpers';
import {EditorTabs, FilterTabs, DecalTypes} from '../config/constants';
import {fadeAnimation, slideAnimation} from '../config/motion';
import { CustomButton, AIPicker, ColorPicker, FilePicker, Tab} from '../components';

function Customizer() {
  const snap = useSnapshot(state);

  const [file, setFile] = useState('');

  const [prompt, setPrompt] = useState('');

  const [generatingImg, setGeneratingImg] = useState(false);

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  });


  //show tab content depending on the active tab
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />
      case "filepicker":
        return <FilePicker 
          file={file}
          setFile={setFile}
          readFile={readFile}
        />
      case "aipicker":
        return <AIPicker
          prompt={prompt}
          setPrompt={setPrompt}
          generatingImg={generatingImg}
          handleSubmit={handleSubmit}
        />
      default:
        return null;
    }
  }

  const handleSubmit = async (type) => {
    if(!prompt) return alert("Please enter a prompt");

    try {
      //call my backend to generate an AI image 
      setGeneratingImg(true);

      const response = await fetch('http://localhost:8080/api/v1/dalle',{
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
          prompt,
        })
      })

      const data = await response.json();

      handleDecals(type, `data:image/png;base64,${data.photo}`)
    } catch (error) {
      alert(error)
    }finally{
      setGeneratingImg(false);
      setActiveEditorTab("")
    }
  }

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
  
    if (result) {
      state[decalType.stateProperty] = result;
  
      if (!activeEditorTab[decalType.filterTab]) {
        handleActiveFilterTab(decalType.filterTab);
      }
    } else {
      // Handle the case when the result is undefined or empty
      console.error('Invalid result:', result);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
          state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
          state.usFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.usFullTexture = false;
        break;
    }

    //set the activeFilterTab ti update the UI
    setActiveFilterTab((prevState) => {
      return{
        ...prevState,
        [tabName]: !prevState[tabName]
      }
    })
  }

  const readFile = (type) => {
    reader(file)
      .then((result) => {
        handleDecals(type,result);
        setActiveEditorTab("");
      })
  }


  const handleDownload = () => {
    // Create a download link and click it programmatically
    const canvas = document.getElementById('canvas');
    const downloadLink = document.createElement('a');
    downloadLink.href = canvas.toDataURL(); // Convert the canvas to a data URL
    downloadLink.download = 'shirt_baked.glb'; // Set the filename for the download
    downloadLink.click(); // Trigger the download
  };


  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
          <motion.div
          key="custom"
          className="absolute top-0 left-0 z-10"
          {...slideAnimation('left')}
          >
            <div className="flex items-center min-h-screen">
              <div className="editortabs-container tabs">
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    handleClick={() => setActiveEditorTab(prevTab => prevTab === tab.name ? "" : tab.name)}
                  />

                ))}

                {generateTabContent()}
              </div>  
            </div>
          </motion.div>
          <motion.div
            className="absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={() => state.intro = true}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
            <CustomButton
              type="filled"
              title="Download"
              handleClick={handleDownload}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm ml-2"
            />
          </motion.div>

          <motion.div
            className="filtertabs-container"
            {...slideAnimation("up")}
          >
            {FilterTabs.map((tab) => (
                  <Tab 
                    key={tab.name}
                    tab={tab}
                    isFilterTab
                    isActiveTab={activeFilterTab[tab.name]}
                    handleClick={() => handleActiveFilterTab(tab.name)}
                  />
                ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Customizer