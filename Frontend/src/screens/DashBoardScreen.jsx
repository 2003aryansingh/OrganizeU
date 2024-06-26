import React from "react";
import { useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userState } from "../store/atoms/User.js";
import ProfileImage from "../assets/profile.jpg";
import { CiSettings } from "react-icons/ci";
import { IoIosLogOut } from "react-icons/io";
import { HiBars3 } from "react-icons/hi2";
import { Outlet } from "react-router-dom";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Dropdown, Modal, Button } from "flowbite-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BASE_USERS_URL } from "../../config";
import { toast, Slide } from "react-toastify";
import axios from "axios";
import { AiOutlineLoading } from "react-icons/ai";
import { HiOutlineExclamationCircle } from "react-icons/hi";

const DashBoardScreen = (props) => {
  const user = useRecoilValue(userState);
  const [openModal, setOpenModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(user.avatar);
  const [previewImage, setPreviewImage] = useState(user.avatar);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const setUser = useSetRecoilState(userState);

  const navigate = useNavigate();

  function onCloseModal() {
    setOpenModal(false);
    setPassword("");
    setUsername(user.username);
    setSelectedImage(user.avatar);
    setPreviewImage(user.avatar);
  }

  const handleImageInput = (event) => {
    const file = event.target.files[0];
    console.log(file);
    setSelectedImage(event.target.files[0]);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const logoutUser = useMutation({
    mutationFn: async () => {
      await axios.post(`${BASE_USERS_URL}/logout`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
    },
    onSuccess: () => {
      toast.success("Logged Out", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      navigate("/");
    },
    onError: () => {
      toast.error(`Something went wrong ! Please try again later`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
    },
  });

  const updateProfile = useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: async (data) => {
      return await axios.put(`${BASE_USERS_URL}/profile`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
    },

    onSuccess: (data, variables) => {
      setUser((oldState) => ({
        ...oldState,
        username: data.data.name,
        email: data.data.email,
        avatar: data.data.avatar,
      }));
      setOpenModal(false);
      toast.success("Profile Updated", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
    },

    onError: (error) => {
      toast.error(`${error.response.data.message}`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
    },
  });

  const handleLogout = () => {
    setUser({
      userId: null,
      username: null,
      email: null,
      avatar: null,
      isLoggedin: false,
    });
    setLogoutModal(false);
    logoutUser.mutate();
  };

  const handleProfileSave = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", username);
    formData.append("password", password);
    formData.append("avatar", selectedImage);

    updateProfile.mutate(formData);
  };

  // const getProfile = useQuery({
  //   queryKey: ["getProfile"],
  //   queryFn: async () => {
  //     const data = await axios.get(`${BASE_USERS_URL}/profile`, {
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       withCredentials: true,
  //     });

  //     const filteredData = {
  //       name: data.data.name,
  //       email: data.data.email,
  //       avatar: data.data.avatar,
  //     };
  //   },
  // });

  return (
    <>
      <Modal
        show={logoutModal}
        size="md"
        onClose={() => setLogoutModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to Logout?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleLogout}>
                {"Yes, I'm sure"}
              </Button>
              <Button color="gray" onClick={() => setLogoutModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal show={openModal} size="md" onClose={onCloseModal} popup>
        <Modal.Header />
        <Modal.Body>
          <div className="max-w-md mx-auto bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="p-4">
              <h2 className="text-center text-xl font-semibold mb-4">
                Edit Profile
              </h2>
              <div className="flex flex-col items-center">
                <label
                  htmlFor="profile-picture-input"
                  className="relative inline-block w-32 h-32 rounded-full overflow-hidden cursor-pointer"
                >
                  <img
                    className="object-cover w-full h-full"
                    src={previewImage || ProfileImage}
                    accept="image/*"
                    alt="Profile"
                  />
                  <input
                    type="file"
                    id="profile-picture-input"
                    onChange={handleImageInput}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                <form className="mt-4 w-full">
                  <div className="mb-4">
                    <label
                      htmlFor="username"
                      className="block text-gray-700 font-medium"
                    >
                      Username:
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={handleUsernameChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block text-gray-700 font-medium"
                    >
                      Password:
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    onClick={handleProfileSave}
                    processingSpinner={
                      <AiOutlineLoading className="h-6 w-6 animate-spin" />
                    }
                    isProcessing={updateProfile.isPending}
                  >
                    Save Changes
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <div className="w-full navbar bg-white shadow-lg sticky top-0 z-10">
        <div className="flex-1">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
              <HiBars3 className="stroke-1 stroke-blue-700" />
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 text-xl lg:text-3xl text-blue-700 font-title">
            OrganizeU
          </div>
        </div>
        <div className="flex-none gap-2">
          <div className="form-control">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-24 md:w-auto"
            />
          </div>
          <Dropdown
            label={
              <Avatar
                alt="User settings"
                img={user.avatar || ProfileImage}
                rounded
              />
            }
            arrowIcon={false}
            inline
          >
            <Dropdown.Header>
              <span className="block text-sm">{user.username}</span>
              <span className="block truncate text-sm font-medium">
                {user.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item onClick={() => setOpenModal(true)} icon={CiSettings}>
              Settings
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              icon={IoIosLogOut}
              onClick={() => {
                setLogoutModal(true);
              }}
            >
              Logout
            </Dropdown.Item>
          </Dropdown>
        </div>
      </div>
      <div className="lg:flex lg:flex-row h-screen bg-white">
        <div className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-gray-200 p-4 ">
          <div className="my-5 px-6">
            <ul className="space-y-2">
              <li className="text-center font-body">
                <Link
                  to="/dashboard/boards"
                  className="bg-blue-500 text-white rounded-full px-4 py-2 transition-all duration-300 block"
                >
                  My Boards
                </Link>
              </li>
              <li className="text-center font-body">
                {/* <Link
                  to="#"
                  className=" bg-blue-500 text-white rounded-full px-4 py-2 transition-all duration-300 block"
                >
                  Templates
                </Link> */}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex-grow p-4 overflow-hidden">
          <Outlet />
          {props.children}
        </div>
      </div>

      <div className="drawer lg:hidden">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-side">
          <label
            htmlFor="my-drawer-2"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul className="menu p-4 w-56 min-h-full bg-base-200 text-base-content">
            <div className="px-2 my-8 text-xl lg:text-xl text-blue-700 font-title select-none">
              OrganizeU
            </div>
            <li>
              <a>My Boards</a>
            </li>
            <li>
              <a>Templates</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DashBoardScreen;
