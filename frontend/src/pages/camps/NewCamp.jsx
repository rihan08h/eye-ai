import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tent, ArrowLeft, MapPin, Calendar, Users, Target } from 'lucide-react';
import { campService } from '../../services/entities.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

export default function NewCamp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    village: '',
    district: '',
    state: 'Karnataka',
    startDate: new Date().toISOString().split('T')[0],
    targetScreenings: 100,
    status: 'Active',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await campService.create({
        ...formData,
        targetScreenings: Number(formData.targetScreenings),
      });
      toast.success('Screening camp registered!');
      navigate('/camps');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create camp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/camps"
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Organize Screening Camp</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Register a rural diabetic eye screening initiative</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-800 shadow-xl">
        <Input
          name="name"
          label="Camp Initiative Name"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Ramanagara PHC Diabetic Retinopathy Camp"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="location"
            label="Specific Venue / Health Centre"
            required
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Primary Health Centre, Ward 3"
          />

          <Input
            name="village"
            label="Village / Town"
            required
            value={formData.village}
            onChange={handleChange}
            placeholder="e.g. Channapatna"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="district"
            label="District"
            required
            value={formData.district}
            onChange={handleChange}
            placeholder="e.g. Ramanagara"
          />

          <Input
            name="targetScreenings"
            type="number"
            label="Target Patient Screenings"
            required
            min="10"
            max="5000"
            value={formData.targetScreenings}
            onChange={handleChange}
            placeholder="150"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/camps')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="cyan"
            loading={loading}
            icon={Tent}
            className="shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Register Screening Camp
          </Button>
        </div>
      </form>
    </div>
  );
}
