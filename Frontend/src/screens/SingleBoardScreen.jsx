import { React, useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AiOutlineLoading } from "react-icons/ai";
import { IoMdAdd } from "react-icons/io";
import { CiSettings } from "react-icons/ci";
import { IoChatboxEllipses, IoClose } from "react-icons/io5";
import Lists from "../components/Lists.jsx";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  BASE_CARDS_URL,
  BASE_USERS_URL,
  BASE_BOARDS_URL,
} from "../../config.js";
import axios from "axios";
import ProfileImage from "../assets/profile.jpg";
import { FaPlus } from "react-icons/fa";
import { RiMailSendFill } from "react-icons/ri";
import Skeleton from "react-loading-skeleton";
import {
  Button,
  Spinner,
  Dropdown,
  Modal,
  FloatingLabel,
  Avatar,
  Badge,
} from "flowbite-react";
import { toast, Slide } from "react-toastify";
import { DragDropContext } from "react-beautiful-dnd";
import { useRecoilValue, useRecoilState } from "recoil";
import { selectedBoardNameState } from "../store/atoms/Boards.js";
import { CgProfile } from "react-icons/cg";
import { userState } from "../store/atoms/User.js";
import Chat from "../components/Chat.jsx";
import { newNotificationStateFamily } from "../store/atoms/Chat.js";
import useBoardMembers from "../hooks/useBoardMembers.js";

const SingleBoardScreen = () => {
  const { boardId } = useParams();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasNewNotification, setNewNotification] = useRecoilState(
    newNotificationStateFamily(boardId)
  );

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    setNewNotification(false);
  };

  const boardMembers = useBoardMembers(boardId);

  const [clickFooter, setClickFooter] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [validEmail, setValidEmail] = useState(false);
  const [isLoadingEmail, setLoadingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const selectedBoardName = useRecoilValue(selectedBoardNameState);
  const userDetails = useRecoilValue(userState);

  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------------------------------------------
  // Mutation for updating the task order
  const updateTaskOrder = useMutation({
    mutationKey: ["updateTaskOrder", boardId],
    mutationFn: (data) => {
      return axios.put(`${BASE_CARDS_URL}/change-task-order`, data, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
    },

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });

      const previousList = queryClient.getQueryData(["board", boardId]);

      console.log(previousList);

      // Modifying the cache for quick update on the UI (Optimistic Updates)
      queryClient.setQueryData(["board", boardId], (oldList) => {
        const cardsArray = [...oldList.data.responseObject];
        const sourceCardIndex = cardsArray.findIndex(
          (card) => card._id.toString() === data.sourceId.toString()
        );
        console.log(sourceCardIndex);
        const destinationCardIndex = cardsArray.findIndex(
          (card) => card._id.toString() === data.destinationId.toString()
        );
        console.log(destinationCardIndex);

        const [reorderedItem] = cardsArray[sourceCardIndex].tasks.splice(
          data.sourceIndex,
          1
        );
        console.log(reorderedItem);
        cardsArray[destinationCardIndex].tasks.splice(
          data.destinationIndex,
          0,
          reorderedItem
        );

        return {
          ...oldList,
          data: {
            ...oldList.data,
            responseObject: cardsArray,
          },
        };
      });

      return { previousList };
    },

    onError: async (err, data, context) => {
      //Restoring server state upon error
      await queryClient.setQueryData(["board", boardId], context.previousList);
      toast.error("Something went wrong :( Pls Try Again Later", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    },

    onSettled: async () => {
      //Invalidating the query
      await queryClient.invalidateQueries({
        queryKey: ["board", boardId],
      });
    },

    onSuccess: (_, variables) => {
      // toast.success("Changes Updated", {
      //   position: "top-center",
      //   autoClose: 2000,
      //   hideProgressBar: true,
      //   closeOnClick: true,
      //   pauseOnHover: true,
      //   draggable: true,
      //   progress: undefined,
      //   theme: "light",
      //   transition: Slide,
      // });
    },
  });

  //Gets triggered when a task swap happens
  function handleOnDragEnd(result) {
    console.log(result);

    if (!result.destination) return;

    if (
      result.source.droppableId === result.destination.droppableId &&
      result.source.index === result.destination.index
    ) {
      return;
    }

    const data = {
      boardId: boardId,
      sourceId: result.source.droppableId,
      sourceIndex: result.source.index,
      destinationId: result.destination.droppableId,
      destinationIndex: result.destination.index,
      taskId: result.draggableId,
    };

    updateTaskOrder.mutate(data);

    console.log(data);
  }

  // ----------------------------------------------------------------------------------------------------------------------------

  //API call for fetching cards and tasks
  const fetchListsnTasks = async () => {
    return axios.get(`${BASE_CARDS_URL}/${boardId}`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
  };

  // -----------------------------------------------------------------------------------------------------------------------------
  //Query for fetching all the cards and tasks of the board
  const { isLoading, data } = useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const data = await fetchListsnTasks(boardId);
      return data;
    },
  });
  // ------------------------------------------------------------------------------------------------------------------------------
  //Mutation for creating a Card in this specific board
  const createCard = useMutation({
    mutationKey: ["createCard", boardId],
    mutationFn: (data) => {
      return axios.post(`${BASE_CARDS_URL}/create`, data, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
    },

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });

      const previousList = queryClient.getQueryData(["board", boardId]);

      setClickFooter(false);

      return { previousList };
    },

    onError: async (err, data, context) => {
      //Restoring server state upon error
      await queryClient.setQueryData(["board", boardId], context.previousList);
      toast.error("Something went wrong :( Pls Try Again Later", {
        position: toast.POSITION.BOTTOM_RIGHT,
      });
    },

    onSettled: async () => {
      //Invalidating the query
      await queryClient.invalidateQueries({
        queryKey: ["board", boardId],
      });
    },

    onSuccess: (_, variables) => {
      toast.success(`Card ${variables.title} was created !`, {
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

  // -----------------------------------------------------------------------------------------------------------------------------
  // Mutation for the invitation link

  const sendInvitation = useMutation({
    mutationKey: ["invitation", emailInput],
    mutationFn: (data) => {
      return axios.post(`${BASE_USERS_URL}/createInvitation`, data, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
    },

    onError: () => {
      setOpenModal(false);
      setLoading(false);

      toast.error("Something went wrong :(", {
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

    onSuccess: (_, variables) => {
      setOpenModal(false);
      setLoading(false);

      toast.success(`Invitation was sent`, {
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

  // -----------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (clickFooter) {
      ref.current.focus();
    }
  }, [clickFooter]);

  const handleSubmit = () => {
    if (!cardTitle.trim()) {
      toast.error("Title cannot be empty", {
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
      setClickFooter(false);
      return;
    }
    const data = {
      title: cardTitle,
      boardId: boardId,
    };
    createCard.mutate(data);
  };

  const validateEmail = (e) => {
    setEmailInput(e.target.value);

    setTimeout(() => {}, 1000);

    setLoadingEmail(true);

    setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (e.target?.value && e.target.value.match(emailRegex)) {
        setValidEmail(true);
      } else {
        setValidEmail(false);
      }
      setLoadingEmail(false);
    }, 1000);
  };

  const handleSendInvitation = () => {
    const data = {
      boardId: boardId,
      emailId: emailInput,
    };

    sendInvitation.mutate(data);
    setLoading(true);
  };

  const isOwner = selectedBoardName?.members?.some(
    (member) =>
      member.role === "owner" && member.user._id === userDetails.userId
  );

  return (
    <>
      <div className="navbar bg-slate-300 shadow-lg rounded-lg">
        <div className="flex-none"></div>
        <div className="flex-1 p-2 gap-4">
          <Modal show={openModal} onClose={() => setOpenModal(false)}>
            <Modal.Header>
              Invite to Board {selectedBoardName.name}
            </Modal.Header>
            <Modal.Body>
              <FloatingLabel
                variant="outlined"
                label="Email"
                onChange={validateEmail}
                value={emailInput}
                helperText={
                  isLoadingEmail ? (
                    <Spinner
                      aria-label="Extra small spinner example"
                      size="xs"
                    />
                  ) : validEmail ? (
                    "Looks Good !"
                  ) : (
                    "Invalid Email"
                  )
                }
                color={validEmail ? "success" : "error"}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={handleSendInvitation}
                disabled={!validEmail}
                processingSpinner={
                  <AiOutlineLoading className="h-6 w-6 animate-spin" />
                }
                isProcessing={loading}
              >
                <RiMailSendFill className="mr-2 h-5 w-5" />
                Send Invitation
              </Button>
            </Modal.Footer>
          </Modal>
          {isOwner && (
            <Dropdown label={selectedBoardName.name} inline>
              <Dropdown.Item icon={IoMdAdd} onClick={() => setOpenModal(true)}>
                Add Member
              </Dropdown.Item>
              <Dropdown.Item icon={CiSettings}>Settings</Dropdown.Item>
            </Dropdown>
          )}
          <Dropdown label="Members" inline>
            {boardMembers.isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="md" />
              </div>
            ) : (
              boardMembers?.data?.data?.response?.map((member, index) => (
                <div className="flex items-center p-2" key={index}>
                  <img
                    src={member.user.avatar || ProfileImage}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <Dropdown.Item key={index} className="inline">
                    {member.user.name}
                  </Dropdown.Item>
                  {member.role === "owner" ? (
                    <Badge color="info" icon={CgProfile} className="">
                      Owner
                    </Badge>
                  ) : (
                    <Badge color="gray" className="">
                      Member
                    </Badge>
                  )}
                </div>
              ))
            )}
          </Dropdown>
        </div>
        <div className="flex-none">
          <button
            className="btn btn-square btn-ghost relative"
            id="openDrawerButton"
            onClick={toggleDrawer}
          >
            <IoChatboxEllipses style={{ fontSize: "1.5rem" }} />
            {hasNewNotification && (
              <div className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></div>
            )}
          </button>
          <div
            id="drawer"
            className={`fixed top-24 right-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ${
              isDrawerOpen ? "" : "translate-x-full"
            }`}
          >
            {/* Drawer content */}
            <button className="absolute top-2 right-2" onClick={toggleDrawer}>
              <IoClose size={24} />
            </button>
            <div className="p-4">
              <Chat boardId={boardId} />
            </div>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex flex-nowrap h-screen overflow-y-hidden">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div className="pt-0 py-2" key={index}>
                  <div className="bg-gray-200 p-4 m-2 w-60 rounded shadow">
                    {Array.from({ length: 5 }).map((__, innerIndex) => (
                      <Skeleton
                        key={innerIndex}
                        height={50}
                        containerClassName="mb-4"
                      />
                    ))}
                  </div>
                </div>
              ))
            : data.data.responseObject.map((item, index) => (
                <Lists
                  title={item.title}
                  key={index}
                  _id={item._id}
                  boardId={boardId}
                  tasks={item.tasks}
                  isOwner={isOwner}
                ></Lists>
              ))}
          {createCard.isPending && (
            <div className="pt-0 py-2">
              <div className="w-72 bg-slate-300 rounded-lg shadow-md p-4 m-2 text-left">
                <div className="mb-4">
                  <h3>{createCard.variables.title}</h3>
                </div>
                <div className="my-2">
                  <ul className="space-y-2 flex flex-col grow min-h-6"></ul>
                </div>
              </div>
            </div>
          )}
          <div className="pt-0 py-2">
            {clickFooter ? (
              <div className="w-72 m-2 p-4 bg-slate-300 rounded-lg shadow-md">
                <form className="font-body">
                  <textarea
                    type="text"
                    className="w-full border p-2 mb-4 h-20 border-white rounded focus:outline-none text-start resize-none"
                    placeholder="Enter a title for this Card..."
                    ref={ref}
                    onChange={(e) => setCardTitle(e.target.value)}
                  ></textarea>
                  <div className="flex">
                    <button
                      type="button"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mr-2"
                      onClick={handleSubmit}
                    >
                      Add Card
                    </button>

                    <button
                      type="button"
                      className="text-gray-600 px-4 py-2 rounded"
                      onClick={() => setClickFooter(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <Button className="w-72 m-2" onClick={() => setClickFooter(true)}>
                <FaPlus className="mr-2 h-5 w-5" />
                Create New Card
              </Button>
            )}
          </div>
        </div>
      </DragDropContext>
    </>
  );
};

export default SingleBoardScreen;
