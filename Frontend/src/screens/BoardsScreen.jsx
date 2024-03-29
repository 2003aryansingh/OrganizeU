import React, { useEffect, useState, useRef } from "react";
import Cards from "../components/Cards";
import axios from "axios";
import { BASE_BOARDS_URL } from "../../config.js";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedBoardNameState } from "../store/atoms/Boards.js";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa";
import { Slide, toast } from "react-toastify";
import { userState } from "../store/atoms/User";
import { Button, Label, Modal, TextInput } from "flowbite-react";

const BoardsScreen = () => {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBoardName, setSelectedBoardName] = useRecoilState(
    selectedBoardNameState
  );
  const { userId } = useRecoilValue(userState);

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const fetchBoards = async () => {
    return axios.get(`${BASE_BOARDS_URL}/`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  };

  const { isLoading, data } = useQuery({
    queryKey: ["boards"],
    queryFn: fetchBoards,
  });

  const createBoard = useMutation({
    mutationKey: ["createBoard"],
    mutationFn: (data) => {
      return axios.post(`${BASE_BOARDS_URL}/create`, data, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
    },
    onSuccess: (data) => {
      // console.log(data);
      queryClient.invalidateQueries(["boards"]);
      setOpenModal(false);
      setSelectedBoardName({
        name: data.data.newBoard.title,
        members: data.data.newBoard.members,
      });
      navigate(`/board/${data.data.newBoard._id}`);
      toast.success(`Board ${data.data.newBoard.title} was created !`, {
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

  function onCloseModal() {
    setOpenModal(false);
    setTitle("");
    setDescription("");
  }

  const handleCreateClick = () => {
    if (!title.trim() && !description.trim()) {
      toast.warn("Please fill in the details", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
      return;
    }

    const data = {
      title: title,
      description: description,
    };

    console.log(data);
    createBoard.mutate(data);
  };

  const ownerBoards = data?.data?.boards.filter((board) => {
    return board.members.some(
      (member) => member.user._id === userId && member.role === "owner"
    );
  });

  const memberBoards = data?.data?.boards.filter((board) => {
    return board.members.some(
      (member) => member.user._id === userId && member.role !== "owner"
    );
  });

  return (
    <>
      <div className="text-center m-2">
        <h2 className="font-bold font-body text-2xl">Boards Owned By You</h2>
      </div>
      <div className="flex flex-wrap justify-start gap-6 p-6 overflow-x-hidden mt-2">
        <Modal
          show={openModal}
          size="md"
          onClose={onCloseModal}
          popup
          dismissible
        >
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-6 font-body">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                Create a New Board
              </h3>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="title" value="Title" />
                </div>
                <TextInput
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="description" value="Description" />
                </div>
                <TextInput
                  id="description"
                  type="text"
                  value={description}
                  required
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="w-full">
                <Button onClick={handleCreateClick}>
                  {createBoard.isPending ? (
                    <span className="loading loading-spinner mr-2 h-5 w-5"></span>
                  ) : (
                    <FaPlus className="mr-2 h-5 w-5" />
                  )}
                  Create
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton height={75} key={index} containerClassName="flex-1" />
            ))
          : ownerBoards.map((item, index) => (
              <Link
                to={`/board/${item._id}`}
                key={index}
                onClick={() => {
                  setSelectedBoardName({
                    name: item.title,
                    members: item.members,
                  });
                }}
              >
                <Cards title={item.title} />
              </Link>
            ))}
        <Button onClick={() => setOpenModal(true)} pill>
          <FaPlus className="mr-2 h-5 w-5" />
          Create New Board
        </Button>
      </div>
      <div className="text-center m-2">
        <h2 className="font-bold font-body text-2xl">
          Boards you are a member of
        </h2>
      </div>
      <div className="flex flex-wrap justify-start gap-6 p-6 overflow-x-hidden mt-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton height={75} key={index} containerClassName="flex-1" />
          ))
        ) : memberBoards.length > 0 ? (
          memberBoards.map((item, index) => (
            <Link
              to={`/board/${item._id}`}
              key={index}
              onClick={() => {
                setSelectedBoardName({
                  name: item.title,
                  members: item.members,
                });
              }}
            >
              <Cards title={item.title} />
            </Link>
          ))
        ) : (
          <p className="font-body">No boards you are a member of :(</p>
        )}
      </div>
    </>
  );
};

export default BoardsScreen;
