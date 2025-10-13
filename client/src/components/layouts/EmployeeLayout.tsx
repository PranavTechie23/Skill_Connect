import React from "react";
import { Outlet } from "react-router-dom";

export default function EmployeeLayout() {
  return (
    <div className="min-h-screen w-screen">
      <Outlet />
    </div>
  );
}
