import Plant from "../models/plant.js";
import User from "../models/user.js";
import axios from "axios";
import { saveReminder } from "./remindersController.js";
import { savePost } from "./postController.js";
import { sendNotificationToExpo } from "../services/notificationService.js";
import Favourite from "../models/favourites.js";

export const savePlant = async (req, res) => {
  try {
    const {
      userId,
      perenulaPlantId,
      plantLat,
      share,
      plantLong,
      plantDob,
      plantName,
      cycle,
      plantDescription,
      scientific_name,
      dimension,
      sunlight,
      edible_leaf,
      indoor,
      watering,
      maintenance,
      city,
      state,
      platPosition,
      plantPicture,
      plantProgress,
      reminders,
    } = req.body;
    // console.log("req", req?.body);
    let shareSocialFeed = share;
    const user = await User.findById(userId);
    // console.log("share", share);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.plants.map(async (item) => {
      if (item?.perenulaPlantId == perenulaPlantId) {
        return res.status(200).json({ error: "You already added this plant" });
      }
    });

    const newPlant = new Plant({
      userId,
      perenulaPlantId,
      plantLat,
      plantLong,
      plantDob,
      plantName,
      cycle,
      plantDescription,
      scientific_name,
      dimension,
      sunlight,
      edible_leaf,
      indoor,
      watering,
      maintenance,
      shareSocialFeed,
      city,
      state,
      platPosition,
      plantPicture,
      plantProgress,
      reminders,
      createdPlantData: new Date(),
    });

    const result = await newPlant.save();
    // console.log("result", result);
    if (reminders) {
      saveReminder(req.body, result).then((res) => {
        console.log("reminder result", res);
      });
    }
    if (share) {
      savePost(req.body, result).then((res) => {
        console.log("post result", res);
      });
    }
    let obj = {
      userId: userId,
      title: "Plant added",
      body: `You have successfully added your plant ${plantName} `,
      data: {
        plantId: result?._id,
        perenulaPlantId: perenulaPlantId,
      },
    };
    await sendNotificationToExpo(obj)
      .then((response) => {
        console.log("response", response);
      })
      .catch((err) => {
        console.log(err);
      });
    res.status(200).json({ message: "Plant saved successfully" });
  } catch (error) {
    console.log("error", error?.message);
    res.status(500).json({ error: error });
  }
};
export const updatePlant = async (req, res) => {
  try {
    const plantId = req.params.id;
    const updatedData = req.body;
    const plant = await Plant.findByIdAndUpdate(plantId, updatedData, {
      new: true,
    });
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }
    let obj = {
      userId: updatedData?.userId,
      title: "Plant added",
      body: `${updatedData?.plantName} progress have added successfully`,
      data: {
        plantId: plantId,
        perenulaPlantId: updatedData?.perenulaPlantId,
      },
    };
    await sendNotificationToExpo(obj)
      .then((response) => {
        console.log("response", response);
      })
      .catch((err) => {
        console.log(err);
      });
    return res
      .status(200)
      .json({ message: "Successfully updated your plant progress" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const getAllPlants = async (req, res) => {
  try {
    const plant = await Plant.find({});
    res.status(200).json(plant);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const getPlantsByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const plants = await Plant.find({
      userId: userId,
    });
    res.status(200).json(plants);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const getAllPlantsFromPerenual = async (req, res) => {
  try {
    const { page } = req.params;
    const plant = await axios.get(
      `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}`
    );
    page;
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const getPlantFromPerenualById = async (req, res) => {
  try {
    const { id, userId, page } = req.params;
    const plant = await axios.get(
      `https://perenual.com/api/species/details/${id}?key=${process.env.PERENUAL_API_KEY}`
    );
    const findFavourite = await Favourite.find({
      userId: userId,
      perenulaPlantId: id,
    });
    res
      .status(200)
      .json({
        ...plant.data,
        favourite: findFavourite?.length > 0 ? true : false,
      });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// export const getSeasonalPlants = async (req, res) => {
//   try {
//     const { season, page } = req.params;
//     const plant = await axios.get(
//       `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&flowering_season=${season}`
//     );
//     res.status(200).json(plant.data);
//   } catch (error) {
//     res.status(500).json({ error: error });
//   }
// };
// https://perenual.com/api/species-care-guide-list?key=sk-jv5x648ec5b40c2691300
export const getSeasonalPlants = async (req, res) => {
  try {
    const { season, page } = req.params;
    const plant = await axios.get(
      `https://perenual.com/api/species-care-guide-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&Type=${season}`
    );
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const searchPlants = async (req, res) => {
  try {
    const { keyword, page } = req.params;
    const plant = await axios.get(
      `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&q=${keyword}`
    );
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const filterPlants = async (req, res) => {
  try {
    const {
      page,
      cycle = "",
      watering = "",
      sunlight = "",
      edible = null,
      indoor = null,
      poisonous = null,
    } = req.params;
    let api = "";
    if (cycle !== "NA" && watering !== "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&watering=${watering}&sunlight=${sunlight}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle !== "NA" && watering !== "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&watering=${watering}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle !== "NA" && watering === "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&sunlight=${sunlight}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle === "NA" && watering !== "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&watering=${watering}&sunlight=${sunlight}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle !== "NA" && watering === "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle === "NA" && watering === "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle === "NA" && watering !== "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&watering=${watering}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    } else if (cycle === "NA" && watering === "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&sunlight=${sunlight}&poisonous=${poisonous}&indoor=${indoor}&edible=${edible}`;
    }
    const plant = await axios.get(api);
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const plantsFAQ = async (req, res) => {
  try {
    const plant = await axios.get(
      `https://perenual.com/api/article-faq-list?key=${process.env.PERENUAL_API_KEY}`
    );
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const indoorPlantsFAQ = async (req, res) => {
  try {
    const {
      page,
      cycle = "",
      watering = "",
      sunlight = "",
      indoor = null,
    } = req.params;
    let api = "";
    if (cycle !== "NA" && watering !== "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&watering=${watering}&sunlight=${sunlight}&indoor=${indoor}`;
    } else if (cycle !== "NA" && watering !== "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&watering=${watering}&indoor=${indoor}`;
    } else if (cycle !== "NA" && watering === "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&sunlight=${sunlight}&indoor=${indoor}`;
    } else if (cycle === "NA" && watering !== "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&watering=${watering}&sunlight=${sunlight}&indoor=${indoor}`;
    } else if (cycle !== "NA" && watering === "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&cycle=${cycle}&indoor=${indoor}`;
    } else if (cycle === "NA" && watering === "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&indoor=${indoor}`;
    } else if (cycle === "NA" && watering !== "NA" && sunlight === "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&watering=${watering}&indoor=${indoor}`;
    } else if (cycle === "NA" && watering === "NA" && sunlight !== "NA") {
      api = `https://perenual.com/api/species-list?page=${page}&key=${process.env.PERENUAL_API_KEY}&sunlight=${sunlight}&indoor=${indoor}`;
    }
    console.log("api", api);
    const plant = await axios.get(api);
    console.log("plant", plant.data);
    res.status(200).json(plant.data);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
