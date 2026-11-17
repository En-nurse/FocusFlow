import { useState, useEffect, useCallback } from "react";
import { TaskContext } from "./taskContextDef";
import { DEFAULT_TASK_COLOR } from "../constants/taskColors";
import { supabase } from "../lib/supabase";
import {
  uploadTaskImage,
  removeStorageFile,
  isUserStoragePath,
} from "../lib/taskStorage";

const DEFAULT_USER = {
  name: "ผู้ใช้งาน",
  email: "",
  bio: "",
  avatarUrl: "",
};

// แปลงข้อมูลจาก Supabase ให้ตรงกับรูปแบบที่ React ใช้
const mapTaskFromDatabase = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  status: task.status || "Not Started",
  priority: task.priority || "Normal",
  createdAt: task.created_at?.split("T")[0] || "",
  startDate: task.start_date ? task.start_date.split("T")[0] : "",
  dueDate: task.due_date ? task.due_date.split("T")[0] : "",
  color: task.color || DEFAULT_TASK_COLOR,
  imageUrl: task.image_url || "",
});

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("app_my_profile");
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // ดึง Tasks จาก Supabase โดยแยกตาม user_id
  const fetchTasks = useCallback(async (userId) => {
    let targetUserId = userId || currentUserId;

    if (!targetUserId) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          targetUserId = authUser.id;
        }
      } catch {
        // ignore auth lookup error
      }
    }

    if (!targetUserId) {
      setTasks([]);
      return [];
    }

    setLoadingTasks(true);
    setTasksError(null);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTasks = (data || []).map(mapTaskFromDatabase);
      setTasks(formattedTasks);

      // แคชข้อมูล tasks แยกตามบัญชีผู้ใช้ (ไม่ลบหรือเขียนทับ app_my_tasks เดิม)
      try {
        localStorage.setItem(
          `app_my_tasks_${targetUserId}`,
          JSON.stringify(formattedTasks),
        );
      } catch {
        // ignore storage error
      }

      return formattedTasks;
    } catch (error) {
      console.error("ดึง Tasks ไม่สำเร็จ:", error.message);
      setTasksError(error.message);

      // หากมีปัญหาเครือข่าย นำข้อมูลจากแคชของผู้ใช้นี้มาแสดงสำรอง
      try {
        const cached = localStorage.getItem(`app_my_tasks_${targetUserId}`);
        if (cached) {
          setTasks(JSON.parse(cached));
        }
      } catch {
        // ignore cache read error
      }
      throw error;
    } finally {
      setLoadingTasks(false);
    }
  }, [currentUserId]);

  // ตรวจจับ Session และ Login State จาก Supabase
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        const authUser = session.user;
        setCurrentUserId(authUser.id);

        // ดึงจากแคชของผู้ใช้นี้ก่อนเพื่อให้โหลดเร็วขึ้น
        try {
          const cached = localStorage.getItem(`app_my_tasks_${authUser.id}`);
          if (cached) {
            setTasks(JSON.parse(cached));
          }
        } catch {
          // ignore
        }

        fetchTasks(authUser.id);

        const userProfileKey = `app_my_profile_${authUser.id}`;
        try {
          const saved = localStorage.getItem(userProfileKey);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            const newProfile = {
              name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split("@")[0] ||
                "ผู้ใช้งาน",
              email: authUser.email || "",
              bio: "",
              avatarUrl: "",
            };
            setUser(newProfile);
            localStorage.setItem(userProfileKey, JSON.stringify(newProfile));
          }
        } catch {
          // ignore error
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const authUser = session.user;
        setCurrentUserId(authUser.id);

        try {
          const cached = localStorage.getItem(`app_my_tasks_${authUser.id}`);
          if (cached) {
            setTasks(JSON.parse(cached));
          }
        } catch {
          // ignore
        }

        fetchTasks(authUser.id);

        const userProfileKey = `app_my_profile_${authUser.id}`;
        try {
          const saved = localStorage.getItem(userProfileKey);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            const newProfile = {
              name:
                authUser.user_metadata?.full_name ||
                authUser.email?.split("@")[0] ||
                "ผู้ใช้งาน",
              email: authUser.email || "",
              bio: "",
              avatarUrl: "",
            };
            setUser(newProfile);
            localStorage.setItem(userProfileKey, JSON.stringify(newProfile));
          }
        } catch {
          // ignore error
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUserId(null);
        setTasks([]);
        setUser(DEFAULT_USER);
        localStorage.removeItem("app_my_profile");
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchTasks]);

  // ซิงค์โปรไฟล์ลง localStorage
  useEffect(() => {
    try {
      localStorage.setItem("app_my_profile", JSON.stringify(user));
      if (currentUserId) {
        localStorage.setItem(
          `app_my_profile_${currentUserId}`,
          JSON.stringify(user),
        );
      }
    } catch (e) {
      console.error("Failed to save user to localStorage", e);
    }
  }, [user, currentUserId]);

  // บันทึก Task ลง Supabase
  const addTaskToSupabase = async (newTask) => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error("กรุณาเข้าสู่ระบบก่อนเพิ่มงาน");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: authUser.id,
        title: newTask.title?.trim() || "",
        description: newTask.description?.trim() || "",
        status: newTask.status || "Not Started",
        priority: newTask.priority || "Normal",
        due_date: newTask.dueDate || null,
        start_date: newTask.startDate || null,
        color: newTask.color || DEFAULT_TASK_COLOR,
        image_url: newTask.imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    return mapTaskFromDatabase(data);
  };

  const addTask = async (newTask) => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error("กรุณาเข้าสู่ระบบก่อนเพิ่มงาน");

    let uploadedStoragePath = null;

    // หากมีการแนบไฟล์จริง ให้อัปโหลดไปยัง Supabase Storage ก่อน
    if (newTask.imageFile instanceof File) {
      uploadedStoragePath = await uploadTaskImage(newTask.imageFile, authUser.id);
    }

    const today = new Date().toISOString().split("T")[0];
    const createdDate = newTask.createdAt || today;
    const targetDueDate = newTask.dueDate || newTask.startDate || createdDate;

    const defaultStart =
      createdDate <= targetDueDate ? createdDate : targetDueDate;

    const defaultDue =
      targetDueDate >= createdDate ? targetDueDate : createdDate;

    // หากอัปโหลดไฟล์ใหม่ให้ใช้ storage path หากไม่มีให้ใช้ imageUrl เดิม (เช่น Base64 เดิม หรือ ค่าว่าง)
    const finalImageUrl = uploadedStoragePath || newTask.imageUrl || "";

    const taskData = {
      ...newTask,
      startDate: newTask.startDate || defaultStart,
      dueDate: newTask.dueDate || defaultDue,
      status: newTask.status || "Not Started",
      priority: newTask.priority || "Normal",
      color: newTask.color || DEFAULT_TASK_COLOR,
      imageUrl: finalImageUrl,
    };

    // ลบ imageFile ออกก่อนบันทึก Database
    delete taskData.imageFile;

    try {
      // บันทึกลง Supabase Database
      const savedTask = await addTaskToSupabase(taskData);

      // อัปเดต state
      setTasks((prev) => [savedTask, ...prev]);

      // บันทึกลงแคชของ user
      if (currentUserId) {
        try {
          const cached = localStorage.getItem(`app_my_tasks_${currentUserId}`);
          const currentList = cached ? JSON.parse(cached) : [];
          localStorage.setItem(
            `app_my_tasks_${currentUserId}`,
            JSON.stringify([savedTask, ...currentList]),
          );
        } catch {
          // ignore
        }
      }

      return savedTask;
    } catch (dbError) {
      // หากอัปโหลดไฟล์สำเร็จแต่บันทึกลงฐานข้อมูลไม่สำเร็จ ให้ลบไฟล์ที่เพิ่งอัปโหลดเพื่อป้องกันไฟล์ค้าง
      if (uploadedStoragePath) {
        await removeStorageFile(uploadedStoragePath, authUser.id);
      }
      throw dbError;
    }
  };

  const updateTask = async (id, updatedFields) => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error("กรุณาเข้าสู่ระบบก่อนแก้ไขงาน");

    const oldTask = tasks.find((t) => t.id === id);
    let uploadedStoragePath = null;

    // หากมีการแนบไฟล์รูปภาพใหม่ ให้อัปโหลดไปยัง Supabase Storage
    if (updatedFields.imageFile instanceof File) {
      uploadedStoragePath = await uploadTaskImage(
        updatedFields.imageFile,
        authUser.id,
      );
    }

    const dbPayload = {};
    if (updatedFields.title !== undefined) dbPayload.title = updatedFields.title.trim();
    if (updatedFields.description !== undefined) dbPayload.description = updatedFields.description.trim();
    if (updatedFields.status !== undefined) dbPayload.status = updatedFields.status;
    if (updatedFields.priority !== undefined) dbPayload.priority = updatedFields.priority;
    if (updatedFields.startDate !== undefined) dbPayload.start_date = updatedFields.startDate || null;
    if (updatedFields.dueDate !== undefined) dbPayload.due_date = updatedFields.dueDate || null;
    if (updatedFields.color !== undefined) dbPayload.color = updatedFields.color;

    // จัดการ image_url สำหรับบันทึกลงฐานข้อมูล
    if (uploadedStoragePath) {
      dbPayload.image_url = uploadedStoragePath;
    } else if (updatedFields.imageUrl !== undefined) {
      dbPayload.image_url = updatedFields.imageUrl || null;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update(dbPayload)
        .eq("id", id)
        .eq("user_id", authUser.id)
        .select()
        .single();

      if (error) throw error;

      const formatted = mapTaskFromDatabase(data);

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? formatted : task)),
      );

      if (currentUserId) {
        try {
          const cached = localStorage.getItem(`app_my_tasks_${currentUserId}`);
          if (cached) {
            const list = JSON.parse(cached);
            const updatedList = list.map((task) => (task.id === id ? formatted : task));
            localStorage.setItem(`app_my_tasks_${currentUserId}`, JSON.stringify(updatedList));
          }
        } catch {
          // ignore
        }
      }

      // ดำเนินการหลังบันทึกการเปลี่ยนแปลงในฐานข้อมูลสำเร็จแล้ว:
      // หากมีการเปลี่ยนรูปภาพหรือลบรูปภาพ และรูปเดิมเป็น Storage Path ของผู้ใช้ ให้ลบรูปเก่าออกจาก Storage
      const oldImageUrl = oldTask?.imageUrl;
      const newImageUrl = formatted.imageUrl;
      if (
        oldImageUrl &&
        oldImageUrl !== newImageUrl &&
        isUserStoragePath(oldImageUrl, authUser.id)
      ) {
        await removeStorageFile(oldImageUrl, authUser.id);
      }

      return formatted;
    } catch (dbError) {
      // หากอัปโหลดสำเร็จแต่บันทึก DB ไม่สำเร็จ ให้ลบไฟล์ใหม่ที่เพิ่งอัปโหลด
      if (uploadedStoragePath) {
        await removeStorageFile(uploadedStoragePath, authUser.id);
      }
      throw dbError;
    }
  };

  const deleteTask = async (id) => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error("กรุณาเข้าสู่ระบบก่อนลบงาน");

    const taskToDelete = tasks.find((t) => t.id === id);

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", authUser.id);

    if (error) throw error;

    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (currentUserId) {
      try {
        const cached = localStorage.getItem(`app_my_tasks_${currentUserId}`);
        if (cached) {
          const list = JSON.parse(cached);
          const filteredList = list.filter((task) => task.id !== id);
          localStorage.setItem(`app_my_tasks_${currentUserId}`, JSON.stringify(filteredList));
        }
      } catch {
        // ignore
      }
    }

    // ลบไฟล์ออกจาก Storage หลังบันทึกในฐานข้อมูลสำเร็จแล้ว (เฉพาะไฟล์ในโฟลเดอร์ผู้ใช้)
    if (
      taskToDelete?.imageUrl &&
      isUserStoragePath(taskToDelete.imageUrl, authUser.id)
    ) {
      await removeStorageFile(taskToDelete.imageUrl, authUser.id);
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authUser) throw new Error("กรุณาเข้าสู่ระบบก่อนเปลี่ยนสถานะงาน");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("user_id", authUser.id)
      .select()
      .single();

    if (error) throw error;

    const formatted = mapTaskFromDatabase(data);

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? formatted : task)),
    );

    if (currentUserId) {
      try {
        const cached = localStorage.getItem(`app_my_tasks_${currentUserId}`);
        if (cached) {
          const list = JSON.parse(cached);
          const updatedList = list.map((task) => (task.id === id ? formatted : task));
          localStorage.setItem(`app_my_tasks_${currentUserId}`, JSON.stringify(updatedList));
        }
      } catch {
        // ignore
      }
    }

    return formatted;
  };

  const updateUser = (updatedProfile) => {
    setUser((prev) => ({ ...prev, ...updatedProfile }));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        user,
        loadingTasks,
        tasksError,
        fetchTasks,
        addTaskToSupabase,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        updateUser,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
